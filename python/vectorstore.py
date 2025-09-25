import common
from langchain_openai import ChatOpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.agents import Tool
from langchain.chains import RetrievalQA
from langchain.schema import Document

# embeddings_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# loader = ConfluenceLoader(
#     url="https://lgucorp.atlassian.net/",
#     username="jihyeai@lguplus.co.kr",
#     api_key=os.getenv("CONFLUENCE_TOKEN"),
#     space_key="UMEET",  # 불러올 공간
#     include_attachments=False
# )
# documents = loader.load()

# 💡 모든 프로세스가 접근할 수 있는 저장 경로 정의
PERSIST_DIR = "./chroma_vector_db"

def create_vectorstore(docs):
    global CACHED_VECTOR_STORE

    text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
    chunk_size=300,
    chunk_overlap=50)
    splits = text_splitter.split_documents(docs)
    vectorstore = Chroma.from_documents(
        documents=splits, embedding=OpenAIEmbeddings(), collection_name="my_db",
         persist_directory=PERSIST_DIR
    )
    CACHED_VECTOR_STORE = vectorstore
    vectorstore.persist() 
    retriever = vectorstore.as_retriever()
    llm = ChatOpenAI(model="gpt-4o-mini")
    qa_chain = RetrievalQA.from_chain_type(llm=llm, chain_type="stuff", retriever=retriever)
    print(f"{len(docs)}개의 문서를 불러왔습니다.")
    print(docs[0])  # 첫 문서 내용 일부 확인

    vectorstore_tool = Tool(
        name="seulgi_note_retriever",
        description="A retriever for accessing information stored in the vectorstore. Use this tool to answer questions about the conversation transcript. Input should be a question.",
        func=qa_chain.invoke
    )
    return vectorstore

def get_vectorstore():
    return Chroma(
                persist_directory=PERSIST_DIR, 
                embedding_function=OpenAIEmbeddings(), # 임베딩 함수는 필수
                collection_name="my_db"
            )

def create_docs(pages):
    global CACHED_VECTOR_STORE
    docs = []
    for p in pages:
        page = common.confluence_get_body_view(p["id"])
        md = common.html_to_markdown(page["html"])
        if not md.strip():
            continue
        docs.append(Document(
            page_content=md,
            metadata={"title": page["title"], "url": page["url"], "id": p["id"]}
        ))
    CACHED_VECTOR_STORE = create_vectorstore(docs)

async def update_docs(text, title):
    global CACHED_VECTOR_STORE
    doc = Document(page_content=text, metadata={"title": title})
    db = get_vectorstore()
    db.add_documents([doc])
    db.persist()
    CACHED_VECTOR_STORE = db
