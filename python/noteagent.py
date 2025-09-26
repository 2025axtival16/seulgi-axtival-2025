import json
from azurespeech import meeting_log
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, AIMessage, HumanMessage

meeting_log_whisper = []


llm = ChatOpenAI(model="gpt-4o-mini")

# LLM에 전달할 때는 status 필드 제거
def get_ready_for_llm():
    clean_log = []
    for entry in meeting_log:
        if entry.get('_status') != 'done':  # 완료되지 않은 발화만 선택
            clean_entry = {k: v for k, v in entry.items() if k != '_status'}
            clean_log.append(clean_entry)
    return clean_log

def get_log_for_llm(log):
    clean_log = []
    log = json.loads(log)
    for entry in log:
        if entry.get('_status') != 'done':  # 완료되지 않은 발화만 선택
            clean_entry = {k: v for k, v in entry.items() if k != '_status'}
            clean_log.append(clean_entry)
    return clean_log

# Agent가 사용할 함수: Whisper로 Azure 로그 덮어쓰기
def overwrite_azure_with_whisper(whisper_text):
    # LangChain에게 "이 Whisper 텍스트를 Azure 로그에 맞춰 덮어쓰기" 요청
    messages = [
        SystemMessage(content="회의록을 Whisper 텍스트로 업데이트하는 Agent입니다."),
        HumanMessage(content=f"""
아래는 현재 Azure 회의록입니다:
{get_ready_for_llm()}

아래는 Whisper에서 인식된 전체 텍스트입니다:
{whisper_text}

각 발화를 다음 규칙으로 JSON 배열에 넣어주세요:

1. Whisper STT 발화를 **무조건 우선**으로 적용합니다.
2. 만약 Whisper STT가 명백히 잘못 인식되었거나 무의미한 텍스트라면,
   해당 구간은 Azure STT 발화를 대신 사용합니다.
3. 반드시 JSON 배열 표준 형식으로만 반환:
[
    {{"speaker": "화자 이름", "text": "발화 내용", "source": "Whisper"}}
]
4. 모든 속성 이름과 문자열 값은 double quotes(\")로 감싸야 합니다.
5. 반환 외에 다른 텍스트, 마크다운, 설명은 절대 포함하지 마세요.
""")
    ]
    resp = llm(messages)
    # resp는 문자열로 올텐데, eval() 혹은 json.loads()로 리스트 형태로 변환 가능
    try:
        # print(resp)
        resp_text = resp.content.strip()
        # 싱글 쿼트를 더블 쿼트로 변환 (단순 replace는 안전하지 않을 수 있음)
        resp_text = resp_text.replace("'", '"')
        updated_log = json.loads(resp.content)  # 안전하게 처리 가능하면 json.loads 권장
        # 각 발화에 status 추가
        for entry in updated_log:
            entry['status'] = 'done'
        print(updated_log)
        # meeting_log_whisper.extend(updated_log)
        # print(meeting_log_whisper)
        return updated_log
    except Exception as e:
        print(f"Agent 로그 덮어쓰기 실패: {e}")


def setting_name_in_meeting_log(log):
    messages = [
        SystemMessage(content="회의록을 Whisper 텍스트로 업데이트하는 Agent입니다."),
        HumanMessage(content="아래는 현재 Whisper가 생성한 회의록 JSON 배열입니다:\n"
    + json.dumps(log, ensure_ascii=False)
    + """

이 회의록에서 "speaker" 필드를 다음 규칙에 따라 업데이트하세요:

규칙:
1. 동일한 사람이 여러 발화를 했으면 같은 이름(또는 같은 화자명)으로 통일합니다.
2. 발화 내용 속에서 자기소개(예: "저는 김아영입니다.", "안녕하세요, 이주혜입니다.")가 있으면,
   해당 **발화를 한 화자에게만** 그 이름을 지정합니다.
3. 자기소개가 없는 화자는 기존 화자 번호("화자 A", "화자 B" 등)를 유지합니다.
   단, 동일 화자가 여러 차례 발화하면 같은 번호로 유지합니다.
4. 이름이 확인되지 않지만 동일 화자가 반복 발화하는 경우 "화자 A", "화자 B", ... 와 같이 번호를 붙여 일관성 있게 유지합니다.
5. 잘못 인식된 이름(예: '김아', '김아란')은 가장 올바른 이름으로 정정합니다. (예: 모두 '김아영')
6. 자기소개로 이름이 지정된 화자와 다른 화자가 혼동되지 않도록 주의하세요.
7. 반드시 표준 JSON 배열만 반환하며, 추가 설명이나 마크다운은 포함하지 마세요.

출력 형식 예시:
[
  {"speaker": "김아영", "text": "저는 김아영입니다.", "source": "Whisper"},
  {"speaker": "김아영", "text": "회의를 시작하겠습니다.", "source": "Whisper"},
  {"speaker": "이주혜", "text": "안녕하세요, 이주혜입니다.", "source": "Whisper"}
]
""")
    ]
    resp = llm(messages)

    try:
        # print(resp)
        resp_text = resp.content.strip()
        # 싱글 쿼트를 더블 쿼트로 변환 (단순 replace는 안전하지 않을 수 있음)
        resp_text = resp_text.replace("'", '"')
        updated_log = json.loads(resp.content)  # 안전하게 처리 가능하면 json.loads 권장
        return updated_log
    except Exception as e:
        print(f"Agent 로그 덮어쓰기 실패: {e}")


# Agent가 사용할 함수: Whisper로 Azure 로그 덮어쓰기
def overwrite_azure_with_whisper_stt(whisper_text, azure_log):
    # LangChain에게 "이 Whisper 텍스트를 Azure 로그에 맞춰 덮어쓰기" 요청
    messages = [
        SystemMessage(content="회의록을 Whisper 텍스트로 업데이트하는 Agent입니다."),
        HumanMessage(content=f"""
아래는 현재 Azure 회의록입니다:
{get_log_for_llm(azure_log)}

아래는 Whisper에서 인식된 전체 텍스트입니다:
{whisper_text}

각 발화를 다음 규칙으로 JSON 배열에 넣어주세요:

1. Whisper STT 발화를 **무조건 우선**으로 적용합니다.
2. 만약 Whisper STT가 명백히 잘못 인식되었거나 무의미한 텍스트라면,
   해당 구간은 Azure STT 발화를 대신 사용합니다.
3. 반드시 JSON 배열 표준 형식으로만 반환:
[
    {{"speaker": "화자 이름", "text": "발화 내용", "source": "Whisper"}}
]
4. 모든 속성 이름과 문자열 값은 double quotes(\")로 감싸야 합니다.
5. 반환 외에 다른 텍스트, 마크다운, 설명은 절대 포함하지 마세요.
""")
    ]
    resp = llm(messages)
    # resp는 문자열로 올텐데, eval() 혹은 json.loads()로 리스트 형태로 변환 가능
    try:
        # print(resp)
        resp_text = resp.content.strip()
        # 싱글 쿼트를 더블 쿼트로 변환 (단순 replace는 안전하지 않을 수 있음)
        resp_text = resp_text.replace("'", '"')
        updated_log = json.loads(resp.content)  # 안전하게 처리 가능하면 json.loads 권장
        # 각 발화에 status 추가
        for entry in updated_log:
            entry['status'] = 'done'
        print(updated_log)
        # meeting_log_whisper.extend(updated_log)
        # print(meeting_log_whisper)
        return updated_log
    except Exception as e:
        print(f"Agent 로그 덮어쓰기 실패: {e}")


async def summarize_meeting_log(text):
    messages = [
        SystemMessage(content=f"""당신은 전문 회의록 요약가입니다. 아래는 회의록의 원문 로그입니다. 
각 발언에는 시간과 발언자가 포함되어 있습니다. 

[회의록 원문]
---
{text}
---

요청사항:
1. 문단별 요약:
   - 각 발언 또는 문단을 읽고 핵심 내용만 추려 한두 문장으로 요약합니다.
   - 요약 시 불필요한 중복은 제거합니다.
2. 시간별 요약:
   - 각 5분 단위(또는 지정 시간 단위)로 회의 진행 내용을 요약합니다.
   - 발언자 구분은 필요하지만, 핵심 아이디어 중심으로 정리합니다.

출력 형식:
[문단별 요약]
1. 요약 문장
2. 요약 문장
...

[시간별 요약]
00:00~05:00: 요약 내용
05:00~10:00: 요약 내용
...""")]
    resp = await llm.apredict_messages(messages)
    # resp는 문자열로 올텐데, eval() 혹은 json.loads()로 리스트 형태로 변환 가능
    try:
        # print(resp)
        resp_text = resp.content.strip()
        print(resp_text)
        # meeting_log_whisper.extend(updated_log)
        # print(meeting_log_whisper)
        return resp_text
    except Exception as e:
        print(f"Agent 요약 실패: {e}")


async def summarize_all(text, title):
    messages = [
        SystemMessage(content=f"""당신은 전문 회의록 요약가입니다. 아래는 회의록의 원문 로그입니다. 
각 발언에는 시간과 발언자가 포함되어 있습니다. 
제목에는 적절한 이모지를 사용하고, 가독성 있게 보일 수 있도록 작성하세요.

[회의록 제목]

{title}

[회의록 원문]

{text}
---

1. 전체 요약:
   - 회의의 주요 논의 내용과 결론을 한두 문단으로 요약합니다.
   - 중요하지 않은 반복 내용은 생략합니다.

2. 주제별 요약:
   - 각 발언들을 읽고 주제를 도출하고 주제에 해당하는 핵심 내용만 추려 한두 문장으로 요약합니다.
   - 발언자 구분은 유지하되, 중복 내용은 제거합니다.

3. 조치사항(Action Items) 도출:
   - 회의 중 결정된 작업, 후속 조치, 담당자와 기한 등을 명확히 정리합니다.
   - 가능한 경우 체크리스트 형태로 출력합니다.

출력 형식:

[전체 요약]
회의 내용 요약 문단

[문단별 요약]
1. 요약 문장
2. 요약 문장
...

[조치사항(Action Items)]
- 담당자: 작업 내용 (기한)
- 담당자: 작업 내용 (기한)
""")]

    resp = await llm.apredict_messages(messages)
    try:
        # print(resp)
        resp_text = resp.content.strip()
        print(resp_text)
        return resp_text
    except Exception as e:
        print(f"Agent 요약 실패: {e}")