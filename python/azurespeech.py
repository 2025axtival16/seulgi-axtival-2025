import azure.cognitiveservices.speech as speechsdk

speakers = {}  # {speaker_id: label}
label_map = {}  # {label: 이름 맵핑, 필요시 사용}
meeting_log = []  # [(speaker, text, source)] 형태
def get_speaker_label(speaker_id):
    """speaker_id가 없으면 Unknown, 없으면 새 라벨 생성"""
    if not speaker_id:
        return "Unknown"
    if speaker_id not in speakers:
        # A, B, C,... 순으로 라벨 생성
        speakers[speaker_id] = chr(65 + len(speakers))
    return speakers[speaker_id]

def handle_transcribed(evt):
    """
    Azure ConversationTranscriber transcribed 이벤트 처리
    """
    # print("evt: ", evt)
    result = evt.result
    # print(result)  # 디버깅용

    if result.reason == speechsdk.ResultReason.RecognizedSpeech:
        speaker_id = getattr(result, "speaker_id", None)
        label = get_speaker_label(speaker_id)
        name = label_map.get(label, f"화자 {label}")

        text = getattr(result, "text", "")
        if text.strip():
            # print(f"[Azure Speaker {name}] {text}")
            meeting_log.append({
                "speaker": name,
                "text": text,
                "source": "Azure"
            })

            # LangChain에 문서 추가
            chunks = splitter.split_text(f"[{name}] {text}")
            vectorstore.add_texts(chunks)

def canceled_handler(s, evt):
    print("Canceled: {}".format(evt.cancellation_details))