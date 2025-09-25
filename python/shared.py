import asyncio
import queue

audio_q = queue.Queue()

stop_event = asyncio.Event()
main_task = None  # main_loop를 가리키는 태스크

docs = []
vector_store = None
vectorstore_tool = None

CACHED_VECTOR_STORE = None