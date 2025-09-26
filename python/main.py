import os
import ms as ms
import confluence as confluence
from fastapi import FastAPI, HTTPException, File, UploadFile, Form, Path
from noteagent import summarize_all, summarize_meeting_log
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import common as common
import html2text
import httpx
from qnaagent import ask_agent
from qnaagent import ask_agent, terminal_chat_with_agent
from recordingaudio import conversation_transcriber, start_audio_capture
from azurespeech import canceled_handler, handle_transcribed, meeting_log
from langchain_openai import ChatOpenAI
import shared
from vectorstore import create_docs, update_docs
import whisperstt
from openai import OpenAI
import asyncio
from fastapi.responses import JSONResponse

app = FastAPI()
SITE='https://lgucorp.atlassian.net'
markdown_converter = html2text.HTML2Text()
CONFLUENCE_TOKEN = os.getenv("CONFLUENCE_TOKEN", "")
CONFLUENCE_EMAIL = os.getenv("CONFLUENCE_EMAIL", "")
CHATGPT_API_KEY = os.getenv("CHATGPT_API_KEY", "")
http_client = httpx.Client(verify=False)
client = OpenAI(api_key=CHATGPT_API_KEY, http_client=http_client)

# 프론트 도메인(포트) 추가: 개발 중이면 보통 Next.js가 3000
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # 배포 후 도메인도 여기에 추가
    # "https://your-frontend.example.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # 개발 편의상 "*"도 가능하나, 배포에선 명시 권장
    allow_credentials=True,
    allow_methods=["*"],         # OPTIONS 포함 모든 메서드 허용
    allow_headers=["*"],         # Content-Type: application/json 등 허용
)


class RagRequest(BaseModel):
    label: str

class RagChatRequest(BaseModel):
    question: str = Field(..., min_length=1)
    # 프론트는 vectorStoreId로 보내고, 서버에선 snake_case로 사용
    vector_store_id: str = Field(..., alias="vectorStoreId")

    class Config:
        allow_population_by_field_name = True



# llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")
llm = ChatOpenAI(model="gpt-4o-mini")
# llm.invoke("안녕하세요!")

# 오디오 캡처
async def audio_capture_loop():
    while not shared.stop_event.is_set():
        await asyncio.to_thread(start_audio_capture)  # 블로킹이면 작은 단위로 처리
        await asyncio.sleep(0.01)  # 루프 양보

# Whisper 처리
async def whisper_loop():
    while not shared.stop_event.is_set():
        await asyncio.to_thread(whisperstt.process_audio)  # 블로킹이면 chunk 단위 처리
        await asyncio.sleep(0.01)

async def main_loop():
    conversation_transcriber.transcribed.connect(handle_transcribed)
    conversation_transcriber.canceled.connect(canceled_handler)
    conversation_transcriber.start_transcribing_async()
    
    await asyncio.gather(
        audio_capture_loop(),
        whisper_loop()
    )
    print("실시간 회의록 시작 (Ctrl+C로 종료)")

# app = FastAPI(title="Confluence Q&A & Summary Agent API")

# @app.post("/api/rag/upload")
# def rag_chat(ragRequest: RagRequest):
#     print(ragRequest.label)
#     label_title = ragRequest.label

#     pages = confluence.search_pages_by_label_in_space(label_title + '완료', 'UMEET')

#     # 2) Vector Store 준비
#     vs = client.vector_stores.create(name=f"conf-{CHATGPT_API_KEY or 'all'}")
#     vs_id = vs.id
#     print("Vector Store:", vs_id)

#     # 3) 페이지들을 업로드(최초 또는 재동기화)
#     common.upload_pages_to_vector_store(vs_id, pages)
#     print("Uploaded to Vector Store")
#     return vs_id

# @app.post("/api/rag/chat")
# def rag(req: RagChatRequest):
#     print("질문:", req.question)
#     print("Vector Store ID:", req.vector_store_id)
#     answer = common.ask_with_file_search(req.vector_store_id, req.question)
#     return {"answer": answer}
#     # common.delete_vs_and_files(VS_ID)

@app.options("/api/userinfo/{name}")
def options_userinfo(name: str):
    return {"message": "CORS preflight OK"}

@app.get("/api/userinfo/{name}")
def get_user_by_name(name:str):
    access_token = ms.get_app_token()
    return ms.get_user_by_name(access_token,name)


# 🔹 요청 모델
class QueryRequest(BaseModel):
    query: str
    thread_id: str = "1"  # 기본값 지정, 필요하면 세션별 관리 가능

# 🔹 응답 모델
class QueryResponse(BaseModel):
    answer: str

@app.post("/api/rag/upload", response_model=QueryResponse)
async def upload_endpoint(req: RagRequest):
    label_title = req.label
    pages = confluence.search_pages_by_label_in_space(label_title + '완료', 'UMEET')
    create_docs(pages)
    return QueryResponse(answer="업로드 완료")
    

@app.post("/api/rag/chat", response_model=QueryResponse)
def ask_endpoint(req: RagChatRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Query is empty")
    answer = ask_agent(req.question, "1")
    return QueryResponse(answer=answer)

# API에서 루프 시작
@app.post("/api/start", response_model=QueryResponse)
async def start_endpoint():
    if shared.main_task is not None and not shared.main_task.done():
        return QueryResponse(answer="이미 실행 중입니다.")
    shared.stop_event.clear()
    shared.main_task = asyncio.create_task(main_loop())
    return QueryResponse(answer="실시간 회의 시작")

@app.post("/api/stop", response_model=QueryResponse)
async def stop_endpoint():
    if shared.main_task is None:
        return QueryResponse(answer="실행중인 작업이 없습니다.")
    shared.stop_event.set()
    conversation_transcriber.stop_transcribing_async()
    return QueryResponse(answer="실시간 회의 종료 완료")

@app.get("/api/note")
async def get_endpoint():
    return whisperstt.final_meeting_log

@app.post("/api/stt")
async def stt_endpoint(audiofile: UploadFile, azuretext: str = Form(...)):
    print(f"Uploaded file name: {audiofile.filename}")
    file_content = await audiofile.read() 
    
    log = await whisperstt.stt_with_whisper(file_content, azuretext)
    return QueryResponse(answer=log)

class UpdateRequest(BaseModel):
    text: str
    title: str

@app.post("/api/note/summary")
async def summary_endpoint(req: UpdateRequest):
    print(req.text)
    summary = await summarize_meeting_log(req.text)
    await update_docs(req.text, req.title)
    return QueryResponse(answer=summary)


class SaveConfluence(BaseModel):
    label: str
    participants: list[str]
    content: str
    title : str

@app.post("/api/note/share")
async def save_confluence_and_send_mail(req: SaveConfluence):
    page = confluence.search_pages_by_label_in_space(req.label+'회의록','UMEET')[0]
    content = req.content
    page_id = confluence.post_content(page["id"],req.title,content)
    print(page_id)
    data = confluence.get_content(page_id)
    links = data["_links"]
    base_url = links["base"]
    webui_path = links["webui"]
    url = base_url+webui_path
    token = ms.get_app_token()

    mail_content = '오늘 회의록 정리 내용입니다.'+url
    print(mail_content)
    ms.send_mail(token,req.participants,mail_content)


@app.post("/api/note/summaryall")
async def summaryall(req: UpdateRequest):
    print(req.text)
    summary = await summarize_all(req.text, req.title)
    await update_docs(req.text, req.title)
    return QueryResponse(answer=summary)


@app.get("/api/comments/{labelName}")
def get_comments_by_label(labelName:str):
    pages = confluence.search_pages_by_label_in_space(labelName+'완료','UMEET')
    data_list = []
    for page in pages:
        page_id = page["id"]
        title = page["title"]
        print(title)
        comments = confluence.get_comment(page_id)
        data={}
        data["page_id"] = page_id
        data["title"] = title
        data["comments"] = comments

        content = confluence.get_content(page_id)
        links = content["_links"]
        base_url = links["base"]
        webui_path = links["webui"]
        url = base_url+webui_path
        data["url"] = url

        data_list.append(data)
    return data_list

