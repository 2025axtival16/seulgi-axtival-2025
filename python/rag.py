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
        input=question,
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


def main():
    label_title_list = ['회의록리뷰']

    for label_title in label_title_list:
        # 라벨 달린 페이지 목록 호출
        pages = confluence.search_pages_by_label_in_space(label_title + '완료', 'UMEET')

        # 2) Vector Store 준비
        vs_id = ensure_vector_store()
        #print("Vector Store:", vs_id)

        # 3) 페이지들을 업로드(최초 또는 재동기화)
        upload_pages_to_vector_store(VS_ID, pages)
        print("Uploaded to Vector Store")

        # 4) 질의 예시
        print("\n=== 질의 예시 ===")
        q = "마당AI챗봇 변경사항 핵심만 bullet로. 출처 링크 포함."
        print(ask_with_file_search(VS_ID, q))
        delete_vs_and_files(VS_ID)





if __name__ == "__main__":
    files = client.vector_stores.files.list(vector_store_id=VS_ID)
    print(files)
    files = []
    after = None
    while True:
        resp = client.files.list(after=after, limit=100)  # 최대 100개까지
        files.extend(resp.data)
        if not resp.has_more:
            break
        after = resp.last_id  # 다음 페이지 커서
    for f in files:
        print(f"id={f.id}, name={getattr(f, 'filename', None)}, purpose={f.purpose}, bytes={f.bytes}")

    main()

