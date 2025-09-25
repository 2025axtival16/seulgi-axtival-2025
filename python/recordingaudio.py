# import os
# from shared import audio_q
# import sounddevice as sd
# import numpy as np
# import azure.cognitiveservices.speech as speechsdk
# import threading

# speech_key = os.getenv("SPEECH_KEY")
# service_region = "koreacentral"

# os.makedirs("audiofile", exist_ok=True)  # 디렉터리가 없으면 생성

# speech_config = speechsdk.SpeechConfig(
#     subscription=speech_key,
#     region=service_region
# )
# audio_config = speechsdk.audio.AudioConfig(use_default_microphone=True)
# speech_config.speech_recognition_language = "ko-KR"  # 한국어 설정
# speech_recognizer = speechsdk.SpeechRecognizer(
#     speech_config=speech_config,
#     audio_config=audio_config
# )
# conversation_transcriber = speechsdk.transcription.ConversationTranscriber(
#     speech_config=speech_config, audio_config=audio_config
# )


# # 오디오 설정 (샘플링 레이트와 채널 수)
# SAMPLERATE = 44100  # 음성 인식에 적합한 샘플링 레이트
# CHANNELS = 1      # 모노 채널
# CHUNK_SIZE_IN_FRAMES = 16000 * 5  # 2초 분량의 오디오 (16000Hz * 2초)

# # 콜백 함수: 오디오 데이터가 들어올 때마다 호출
# def audio_callback(indata, frames, time, status):
#     """sounddevice 스트림에서 오디오 데이터를 캡처하고 큐에 넣는 함수"""
#     if status:
#         print(f"Error in audio stream: {status}")
#     # 들어온 오디오 데이터를 큐에 추가
#     audio_chunk = (indata.copy() * 32767).astype(np.int16)
#     audio_q.put(audio_chunk)

# # 오디오 스트림을 열고 실시간 캡처 시작
# def start_audio_capture():
#     """마이크 오디오 캡처를 시작하는 함수"""
#     try:
#         with sd.InputStream(
#             samplerate=SAMPLERATE,
#             channels=CHANNELS,
#             callback=audio_callback
#         ) as stream:
#             print("마이크 녹음 시작... 'Ctrl+C'를 눌러 종료하세요.")
#             # 스트림이 계속 실행되도록 유지
#             # 이 스레드는 마이크 입력이 끝날 때까지 대기
#             threading.Event().wait()
#     except Exception as e:
#         print(f"Error starting audio stream: {e}")