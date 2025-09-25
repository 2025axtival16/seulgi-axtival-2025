import os
import httpx
from openai import OpenAI
import confluence as confluence
import httpx
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
import html2text
import os, io, time, requests, textwrap
from typing import List, Dict
from bs4 import BeautifulSoup
from openai import OpenAI

SITE='https://lgucorp.atlassian.net'
markdown_converter = html2text.HTML2Text()
CONFLUENCE_TOKEN = os.getenv("CONFLUENCE_TOKEN", "")
CONFLUENCE_EMAIL = os.getenv("CONFLUENCE_EMAIL", "")
CHATGPT_API_KEY = os.getenv("CHATGPT_API_KEY", "")
VS_ID = os.getenv("VS_ID","")

http_client = httpx.Client(verify=False)

client = OpenAI(api_key=CHATGPT_API_KEY, http_client=http_client)
def call_chatgpt(system_prompt, user_prompt):

    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=1.0,
        max_tokens=400
    )
    return resp.choices[0].message.content



def confluence_search(space_key: str, label: str = "", limit: int = 50) -> List[Dict]:
    """
    Confluence CQL로 페이지 id 목록 가져오기
    """
    cql_parts = [f'space="{space_key}"', 'type="page"']
    if label:
        cql_parts.append(f'label="{label}"')
    cql = " and ".join(cql_parts)

    url = f"{SITE}/wiki/rest/api/search"
    start = 0
    results = []
    while True:
        params = {
            "cql": cql,
            "limit": str(limit),
            "start": str(start),
            "expand": "content.version"
        }
        r = requests.get(url, params=params, auth=(CONFLUENCE_EMAIL, CONFLUENCE_TOKEN))
        r.raise_for_status()
        data = r.json()
        for hit in data.get("results", []):
            content = hit.get("content", {}) or {}
            if content.get("type") != "page":
                continue
            results.append({
                "id": content.get("id"),
                "title": content.get("title"),
                "version": (content.get("version") or {}).get("number"),
            })
        if len(data.get("results", [])) < limit:
            break
        start += limit
        time.sleep(0.1)
    return results

def confluence_get_body_view(page_id: str) -> Dict[str, str]:
    """
    페이지 본문(뷰용 HTML)과 URL
    """
    url = f"{SITE}/wiki/rest/api/content/{page_id}"
    params = {
        "expand": "body.view,version,space"
    }
    r = requests.get(url, params=params, auth=(CONFLUENCE_EMAIL, CONFLUENCE_TOKEN), verify=False)
    r.raise_for_status()
    data = r.json()
    html = ((data.get("body") or {}).get("view") or {}).get("value", "")
    title = data.get("title", f"page-{page_id}")
    webui_link = f"{SITE}/wiki/spaces/{(data.get('space') or {}).get('key')}/pages/{page_id}"
    return {"title": title, "html": html, "url": webui_link}

def html_to_markdown(html: str) -> str:
    """
    간단 변환: HTML → 텍스트(마크다운풍)
    (정밀 마크다운 변환이 필요하면 html2text 사용 권장)
    """
    soup = BeautifulSoup(html, "html.parser")
    # 코드 블록/표 등은 단순 텍스트화(필요시 커스텀)
    for br in soup.find_all("br"):
        br.replace_with("\n")
    text = soup.get_text("\n")
    # 연속 개행/공백 정리
    lines = [l.rstrip() for l in text.splitlines()]
    compact = "\n".join([l for l in lines if l.strip() != ""])
    return compact

def write_markdown_file(title: str, url: str, page_id: str, body_md: str) -> io.BytesIO:
    """
    파일 검색시 인용에 출처가 보이도록 상단에 메타 정보 헤더 포함
    """
    header = textwrap.dedent(f"""\
    # {title}
    [Confluence 원문]({url})
    Page-ID: {page_id}

    ---
    """)
    buf = io.BytesIO()
    buf.write((header + "\n" + body_md).encode("utf-8"))
    buf.seek(0)
    return buf

def ensure_vector_store() -> str:
    vs_id = os.getenv("VECTOR_STORE_ID") or ""
    if vs_id:
        # 기존 것 재사용
        return vs_id
    vs = client.vector_stores.create(name=f"conf-{CHATGPT_API_KEY or 'all'}")
    return vs.id

def upload_pages_to_vector_store(vs_id: str, pages: List[Dict]):
    """
    Confluence 페이지들을 .md로 변환해 Vector Store에 업로드
    """
    for p in pages:
        page = confluence_get_body_view(p["id"])
        md = html_to_markdown(page["html"])
        if not md.strip():
            continue
        file_bytes = write_markdown_file(page["title"], page["url"], p["id"], md)
        # 파일명에 pageId를 넣어 추적
        fname = f"{p['id']}_{page['title'].replace('/', '_')}.md"
        print("fname : " + fname)
        up = client.files.create(file=(fname, file_bytes), purpose="assistants")
        client.vector_stores.files.create(vector_store_id=vs_id, file_id=up.id)

def ask_with_file_search(vs_id: str, question: str) -> str:
    resp = client.responses.create(
        model="gpt-4.1-mini",
        input=[
            {
                "role": "system",
                "content": (
                    "진척사항을 가독성 좋은 텍스트로 요약해 주세요. "
                    "항상:\n"
                    "- 큰 주제는 번호 매기기\n"
                    "- 세부 항목은 하위 bullet(-)으로 표시\n"
                    "- 마크다운이나 HTML 태그는 사용하지 마세요.\n"
                    "출력은 순수 텍스트로만 해주세요."
                    "각 문장의 끝에 줄바꿈을 넣어주세요."
                ),
            },
            {
                "role": "user",
                "content": question,
            },
        ],
        tools=[{"type": "file_search", "vector_store_ids": [vs_id]}],
    )
    return resp.output_text

def delete_vs_and_files(vs_id: str):
    all_file_ids = []
    resp = client.vector_stores.files.list(vector_store_id=vs_id)
    for f in resp.data:
        # 실제 file_id는 여기서 가져오기
        fid = getattr(f, "file_id", None) or getattr(f, "id", None)
        name = getattr(f, "filename", None)
        all_file_ids.append((fid, name))
        # 먼저 Vector Store에서 연결 제거
        client.vector_stores.files.delete(vector_store_id=vs_id, file_id=f.id)

    # 이제 File 스토리지에서도 삭제
    for fid, name in all_file_ids:
        if not fid:
            continue
        try:
            client.files.delete(fid)
            print("Deleted file object:", name or fid)
        except Exception as e:
            print("Delete failed:", fid, e)
