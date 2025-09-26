from langchain_openai import ChatOpenAI
from shared import CACHED_VECTOR_STORE
from langgraph.prebuilt import create_react_agent
from vectorstore import get_vectorstore
from langchain_core.messages import SystemMessage, AIMessage, HumanMessage
from langgraph.store.memory import InMemoryStore
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field 

def summarize_meeting(query: str, context) -> str:
    """
    query: "회의 요약해줘" 등
    context: 검색된 문서 내용

    검색된 문서를 기반으로 요약을 실행합니다.
    """
    answer = llm.invoke(f"다음 문서를 참고해서 답변해줘:\n{context}\n질문: {query}")
    return answer

class SummarizeMeetingArgs(BaseModel):
  query: str = Field(description="사용자 요청 내용")
  context: str = Field(description="검색된 문서 내용")

summarize_meeting_tool = StructuredTool.from_function(
        func=summarize_meeting, name="summarize_meeting",
        description="검색한 내용을 토대로, 관련 내용만 요약해줍니다.",
        args_schema=SummarizeMeetingArgs)

def search_meeting_notes(query: str) -> str:
    """회의록에서 관련 문서를 검색"""
    global CACHED_VECTOR_STORE
    CACHED_VECTOR_STORE = get_vectorstore()
    docs = CACHED_VECTOR_STORE.similarity_search(query, k=5)
    return "\n".join([d.page_content for d in docs])

def get_all_meeting_notes():
    global CACHED_VECTOR_STORE
    # 벡터 스토어에서 전체 문서 가져오기
    CACHED_VECTOR_STORE = get_vectorstore()
    all_docs = CACHED_VECTOR_STORE.get(include=["documents"])["documents"]

    # 문서 내용만 추출
    all_texts = [d.page_content if hasattr(d, "page_content") else str(d) for d in all_docs]
    full_text = "\n".join(all_texts)
    return full_text

get_all_meeting_notes_tool = StructuredTool.from_function(
    func=get_all_meeting_notes, name="get_all_meeting_notes",
    description="회의의 전체 문서를 가져올 수 있습니다"
)

class SearchMeetingNotesArgs(BaseModel):
  query: str = Field(description="사용자 요청 내용")

search_meeting_notes_tool = StructuredTool.from_function(
        func=search_meeting_notes, name="search_meeting_notes",
        description="회의록에서 관련 내용을 검색할 수 있습니다.",
        args_schema=SearchMeetingNotesArgs)

def summarize_tasks(query: str, context: str) -> str:
    """회의록 내용을 받아 '해야 할 일' 중심으로 요약"""
    import re

    # 간단히 문장 단위로 나누고 "해야", "필요", "조치", "Action" 등의 키워드 포함 문장만 추출
    sentences = re.split(r'[.\n]', context)
    tasks = [s.strip() for s in sentences if re.search(r'해야|필요|조치|Action', s)]
    
    if not tasks:
        return "회의록에서 명확한 해야 할 일이 발견되지 않았습니다."
    
    # 번호 붙여서 반환
    return "\n".join([f"{i+1}. {task}" for i, task in enumerate(tasks)])

class SummarizeTasksArgs(BaseModel):
  query: str = Field(description="사용자 요청 내용")
  context: str = Field(description="검색된 문서 내용")

summarize_tasks_tool = StructuredTool.from_function(
    func=summarize_tasks, name="summarize_tasks",
    description="회의록 내용을 받아 '해야 할 일' 중심으로 요약합니다.",
    args_schema=SummarizeTasksArgs
)

sys_msg = SystemMessage(content="""
당신은 회사 회의록 기반 정보 제공과 요약을 전문으로 하는 Assistant입니다.
사용자가 질문하면 다음 규칙에 따라 답변하세요:

1. 사용자가 회의 관련 질문을 하면 search_meeting_notes_tool을 통해 관련 문서를 검색할 수 있습니다.
2. 사용자가 요약을 요청하면 검색된 문서를 바탕으로 summarize_meeting_tool을 호출하여 답변합니다.
3. 사용자가 '요약'을 요청하면 summarize_meeting_tool을 사용해 간결하게 요약합니다.
4. 사용자가 '해야 할 일' 또는 '할 일' 정리 요청을 하면 search_meeting_notes_tool을 통해 검색된 문서를 바탕으로 summarize_tasks_tool을 사용해 회의록에서 해야 할 일을 추출하고 정리합니다.
5. 모든 답변은 정확하고 간결하게 작성하며, 출처가 필요하면 검색된 회의록 내용을 참고합니다.
6. 검색, 요약, 해야 할 일 정리 외의 불필요한 정보는 포함하지 마세요.
7. 전체 요약, 전체 회의 분석 등등 전체 회의 문서에 대한 요청이 들어오면 get_all_meeting_notes을 사용해서 전체 문서를 가져옵니다.

사용자는 질문을 입력할 것이며, 당신은 적절한 Tool(Action)을 선택해 처리하고 최종 답변을 제공합니다.
최종 답변은 아래와 같은 형식으로 출력하세요.

최종 답변:

#### 제목
💬 내용1
💬 내용2
""")

llm = ChatOpenAI(model="gpt-4o-mini")
tools = [summarize_meeting_tool,  search_meeting_notes_tool, summarize_tasks_tool, get_all_meeting_notes_tool]
checkpointer = MemorySaver()
store = InMemoryStore()
agent = create_react_agent(
    llm.bind_tools(tools),
    tools=tools,
    prompt=sys_msg,
    checkpointer=checkpointer,
    store=store
)

def terminal_chat_with_agent():
    print("=== 컨플루언스 Q&A 및 요약 에이전트 ===")
    print("종료하려면 'exit' 입력")

    while True:
        query = input("질문 또는 요약 요청: ")
        if query.lower() in ("exit", "quit"):
            break

        try:
            # 사용자 입력을 agent에 전달
            result = agent.invoke({"messages" : HumanMessage(query)}, config={"configurable" : {"thread_id" : "1"}})

            # 반환 내용 확인 후 출력
            # agent에 따라 dict 형태일 수 있으니 먼저 확인
            if isinstance(result, dict):
                output_text = result.get("output", str(result))
            else:
                output_text = str(result)

            for m in result["messages"]:
                m.pretty_print()

        except Exception as e:
            print(f"오류 발생: {e}\n")

# 🚀 agent 호출 함수
def ask_agent(query: str, thread_id: str = "1") -> str:
    """
    사용자 질문을 받아 agent를 실행하고, 결과 텍스트만 반환
    """
    try:
        # HumanMessage로 감싸서 agent에 전달
        result = agent.invoke(
            {"messages" : HumanMessage(query)},
            config={"configurable": {"thread_id": thread_id}}
        )

        messages = result.get("messages", [])
        for m in result["messages"]:
            m.pretty_print()
        # 뒤에서부터 AIMessage 찾기
        for m in reversed(messages):
            if m.__class__.__name__ == "AIMessage":  # AIMessage 타입인지 확인
                return m.content
        return ""  # AI 메시지가 없으면 빈 문자열 반환

    except Exception as e:
        return f"오류 발생: {e}"
