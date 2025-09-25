import uuid
from noteagent import overwrite_azure_with_whisper, overwrite_azure_with_whisper_stt, setting_name_in_meeting_log
from shared import audio_q, stop_event
import numpy as np
import soundfile as sf
import whisper
from openai import OpenAI
import time
import uuid
import noisereduce as nr

final_meeting_log = []

whisper_model = whisper.load_model("small")  # Whisper 무료 STT

client = OpenAI()
SAMPLE_RATE = 16000
ORIG_SAMPLE_RATE = None  # 원본 오디오의 샘플 레이트 (예시)
CHUNK_DURATION = 30  # 초 단위
KEEP_DURATION = 5

def detect_sample_rate(audio_chunk_length, expected_duration=1.0):
    """첫 번째 청크의 길이로 샘플 레이트 추정"""
    return int(audio_chunk_length / expected_duration)

def process_audio():
    global ORIG_SAMPLE_RATE
    last_flush_time = time.time()
    # 누적 오디오는 원본 샘플 레이트로 유지
    accumulated_audio = np.array([], dtype=np.float32)
    sample_rate_detected = False

    while True:
        if audio_q.empty():
            if stop_event.is_set() and len(accumulated_audio) == 0:
                break
            time.sleep(0.01)
            continue
        if not audio_q.empty():
            audio_chunk = audio_q.get()
            if audio_chunk.dtype == np.int16:
                audio_chunk = audio_chunk.astype(np.float32) / 32767.0  # 정확한 정규화
            elif audio_chunk.dtype == np.int32:
                audio_chunk = audio_chunk.astype(np.float32) / 2147483647.0
            
            # 오디오 증폭 코드 제거
            # audio_chunk *= 1.5
            # 첫 번째 청크에서 샘플 레이트 자동 감지
            if not sample_rate_detected and len(audio_chunk) > 0:
                # 일반적인 샘플 레이트들로 테스트
                possible_rates = [44100, 48000, 22050, 16000, 8000]
                chunk_length = len(audio_chunk)
                
                for rate in possible_rates:
                    # 1초 분량의 데이터라고 가정했을 때의 추정 길이
                    if abs(chunk_length - rate) < rate * 0.1:  # 10% 오차 허용
                        ORIG_SAMPLE_RATE = rate
                        break
                
                if ORIG_SAMPLE_RATE is None:
                    ORIG_SAMPLE_RATE = 44100  # 기본값
                
                print(f"감지된 샘플 레이트: {ORIG_SAMPLE_RATE} Hz")
                print(f"청크 크기: {chunk_length} 샘플")
                sample_rate_detected = True
            
            accumulated_audio = np.append(accumulated_audio, audio_chunk)

        # CHUNK_DURATION 초마다 Whisper 호출
        if time.time() - last_flush_time >= CHUNK_DURATION and len(accumulated_audio) > 0:
            # 30초 분량의 오디오만 추출하여 처리
            audio_to_process = accumulated_audio[:CHUNK_DURATION * ORIG_SAMPLE_RATE]
            print(f"처리할 오디오: {len(audio_to_process)} 샘플, {len(audio_to_process)/ORIG_SAMPLE_RATE:.2f}초")
            # 1. 노이즈 감소 적용
            # 노이즈가 없는 부분을 기준으로 노이즈 프로파일을 생성
            # 간단한 예시로 전체 오디오를 노이즈 감소하지만,
            # 실제로는 묵음 구간을 찾아 노이즈 프로파일을 생성하는 것이 더 효과적입니다.
            try:
                audio_reduced = nr.reduce_noise(
                    y=audio_to_process, 
                    sr=ORIG_SAMPLE_RATE,
                    stationary=False,  # 정상 노이즈만 처리
                    prop_decrease=0.8  # 50%로 감소
                )
                print("노이즈 감소 적용됨")
            except Exception as e:
                print(f"노이즈 감소 실패: {e}, 원본 사용")
                audio_reduced = audio_to_process
            # 2. Whisper에 최적화된 16000Hz로 리샘플링
            # 고품질 리샘플링
            # 리샘플링
            # if ORIG_SAMPLE_RATE != SAMPLE_RATE:
            #     audio_resampled = librosa.resample(
            #         audio_reduced, 
            #         orig_sr=ORIG_SAMPLE_RATE, 
            #         target_sr=SAMPLE_RATE
            #     )
            #     print(f"리샘플링: {ORIG_SAMPLE_RATE}Hz -> {SAMPLE_RATE}Hz")
            # else:
            #     audio_resampled = audio_reduced
            #     print("리샘플링 불필요")
            audio_resampled = audio_reduced
            
            # 정규화 개선
            rms = np.sqrt(np.mean(audio_resampled**2))
            max_val = np.max(np.abs(audio_resampled))
            
            print(f"오디오 통계 - RMS: {rms:.4f}, Max: {max_val:.4f}")
            
            if max_val > 0.001:
                # RMS 기반 정규화가 더 자연스러움
                if rms > 0.001:
                    target_rms = 0.15  # 적절한 음량
                    audio_resampled = audio_resampled * (target_rms / rms)
                else:
                    audio_resampled = audio_resampled / max_val * 0.7
            
            # 클리핑 방지
            # audio_resampled = np.clip(audio_resampled, -0.95, 0.95)

            audiouuid = uuid.uuid4()
            
            # 리샘플링된 오디오를 16000Hz로 저장
            sf.write(f"audiofile/temp-{audiouuid}.wav", audio_resampled, ORIG_SAMPLE_RATE, subtype='PCM_16')
            # sf.write(f"temp-{audiouuid}.flac", audio_resampled, samplerate=SAMPLE_RATE, format="FLAC")
            # ffmpeg로 WebM 압축
            # ffmpeg.input(f"temp-{audiouuid}.webm").output(f"temp-{audiouuid}-converted.wav", ar=16000, ac=1, format="wav").run(overwrite_output=True)

            
            with open(f"audiofile/temp-{audiouuid}.wav", "rb") as f:
                result = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=f,
                    language="ko"
                )

            # print(f"[Whisper-1 STT] {result.text}")
            log = overwrite_azure_with_whisper(result.text)
            # log = setting_name_in_meeting_log(log)
            final_meeting_log.extend(log)

            # print(final_meeting_log)
            for entry in final_meeting_log:
                speaker = entry['speaker']
                source = entry['source']
                text = entry['text']
                print(f"[{speaker} | {source}] {text}")

            # 처리된 30초 분량 제거
            accumulated_audio = accumulated_audio[CHUNK_DURATION * ORIG_SAMPLE_RATE:]
            last_flush_time = time.time()
    if len(accumulated_audio) > 0:
        audio_to_process = accumulated_audio
        print(f"처리할 오디오: {len(audio_to_process)} 샘플, {len(audio_to_process)/ORIG_SAMPLE_RATE:.2f}초")
            # 1. 노이즈 감소 적용
            # 노이즈가 없는 부분을 기준으로 노이즈 프로파일을 생성
            # 간단한 예시로 전체 오디오를 노이즈 감소하지만,
            # 실제로는 묵음 구간을 찾아 노이즈 프로파일을 생성하는 것이 더 효과적입니다.
        try:
            audio_reduced = nr.reduce_noise(
                y=audio_to_process, 
                sr=ORIG_SAMPLE_RATE,
                stationary=False,  # 정상 노이즈만 처리
                prop_decrease=0.8  # 50%로 감소
            )
            print("노이즈 감소 적용됨")
        except Exception as e:
            print(f"노이즈 감소 실패: {e}, 원본 사용")
            audio_reduced = audio_to_process
        # 2. Whisper에 최적화된 16000Hz로 리샘플링
        # 고품질 리샘플링
        # 리샘플링
        # if ORIG_SAMPLE_RATE != SAMPLE_RATE:
        #     audio_resampled = librosa.resample(
        #         audio_reduced, 
        #         orig_sr=ORIG_SAMPLE_RATE, 
        #         target_sr=SAMPLE_RATE
        #     )
        #     print(f"리샘플링: {ORIG_SAMPLE_RATE}Hz -> {SAMPLE_RATE}Hz")
        # else:
        #     audio_resampled = audio_reduced
        #     print("리샘플링 불필요")
        audio_resampled = audio_reduced
        
        # 정규화 개선
        rms = np.sqrt(np.mean(audio_resampled**2))
        max_val = np.max(np.abs(audio_resampled))
        
        print(f"오디오 통계 - RMS: {rms:.4f}, Max: {max_val:.4f}")
        
        if max_val > 0.001:
            # RMS 기반 정규화가 더 자연스러움
            if rms > 0.001:
                target_rms = 0.15  # 적절한 음량
                audio_resampled = audio_resampled * (target_rms / rms)
            else:
                audio_resampled = audio_resampled / max_val * 0.7
        
        # 클리핑 방지
        # audio_resampled = np.clip(audio_resampled, -0.95, 0.95)

        audiouuid = uuid.uuid4()
        
        # 리샘플링된 오디오를 16000Hz로 저장
        sf.write(f"audiofile/temp-{audiouuid}.wav", audio_resampled, ORIG_SAMPLE_RATE, subtype='PCM_16')
        # sf.write(f"temp-{audiouuid}.flac", audio_resampled, samplerate=SAMPLE_RATE, format="FLAC")
        # ffmpeg로 WebM 압축
        # ffmpeg.input(f"temp-{audiouuid}.webm").output(f"temp-{audiouuid}-converted.wav", ar=16000, ac=1, format="wav").run(overwrite_output=True)

        
        with open(f"audiofile/temp-{audiouuid}.wav", "rb") as f:
            result = client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                language="ko"
            )

        # print(f"[Whisper-1 STT] {result.text}")
        log = overwrite_azure_with_whisper(result.text)
        log = setting_name_in_meeting_log(log)
        final_meeting_log.extend(log)

        # print(final_meeting_log)
        for entry in final_meeting_log:
            speaker = entry['speaker']
            source = entry['source']
            text = entry['text']
            print(f"[{speaker} | {source}] {text}")
    print("whisper stt process_audio 종료 완료")

def stt_with_whisper(audiofile, azuretext):
    result = client.audio.transcriptions.create(
                model="whisper-1",
                file=audiofile,
                language="ko"
            )
    # print(f"[Whisper-1 STT] {result.text}")
    log = overwrite_azure_with_whisper_stt(result.text, azuretext)
    log = setting_name_in_meeting_log(log)
    print(log)
    return log