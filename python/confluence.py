import requests
import os
from dotenv import load_dotenv
import json
from markdownify import markdownify as md


load_dotenv()
SITE = "https://lgucorp.atlassian.net"
CONFLUENCE_TOKEN = os.getenv("CONFLUENCE_TOKEN", "")
CONFLUENCE_EMAIL = os.getenv("CONFLUENCE_EMAIL", "")

def get_content_by_title(title):
    url = f"https://lgucorp.atlassian.net/wiki/rest/api/content?expand=version"
    auth = (CONFLUENCE_EMAIL, CONFLUENCE_TOKEN)
    headers = {
        "Content-Type": "application/json"
    }
    params = {
        "title": title,
        "type": "page",  # 페이지 타입만 검색
        "spaceKey": "UMEET" # AINews에서만 검색
    }
    #print(f"req.url: {url}")
    #print(f"req.headers: {headers}")
    #print(f"req.data: {data}")

    try:
        response = requests.get(url, auth=auth, headers=headers, params=params, verify=False)
        #print(f"Response: {response.status_code}")
        #print(f"Headers: {response.headers}")
        #print(f"Content: {response.text}")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")


def get_content(page_id):
    url = f"https://lgucorp.atlassian.net/wiki/rest/api/content/{page_id}?expand=version,body.storage,space"
    auth = (CONFLUENCE_EMAIL,CONFLUENCE_TOKEN)
    headers = {
        "Content-Type": "application/json"
    }
    #print(f"req.url: {url}")
    #print(f"req.headers: {headers}")
    #print(f"req.data: {data}")

    try:
        response = requests.get(url, auth=auth, headers=headers, verify=False)
        #print(f"Response: {response.status_code}")
        #print(f"Headers: {response.headers}")
        #print(f"Content: {response.text}")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")



def post_content(parent_id, title, content):
    url = f"https://lgucorp.atlassian.net/wiki/rest/api/content"
    auth = (CONFLUENCE_EMAIL, CONFLUENCE_TOKEN)
    headers = {
        "Content-Type": "application/json"
    }
    data = {
        "title": title,
        "type": "page",
        "space": { "key": "UMEET" },
        "ancestors": [{ "id": parent_id }],
        "body": {
            "storage": {
                "value": content,
                "representation": "storage"
            }
        }
    }
    #print(f"req.url: {url}")
    #print(f"req.headers: {headers}")
    #print(f"req.data: {data}")

    try:
        response = requests.post(url, auth=auth, headers=headers, data=json.dumps(data), verify=False)
        #print(f"Response: {response.status_code}")
        #print(f"Headers: {response.headers}")
        #print(f"Content: {response.text}")
        response.raise_for_status()
        return response.json()["id"]
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")

def post_label(id, content):
    url = f"https://lgucorp.atlassian.net/wiki/rest/api/content/"+id+"/label"
    auth = (CONFLUENCE_EMAIL, CONFLUENCE_TOKEN)
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    data = {
        "name": f"{content}",
    }

    try:
        response = requests.post(url, auth=auth, headers=headers, data=json.dumps(data), verify=False)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")

def search_pages_by_label_in_space(label: str, space_key: str, limit: int = 50):
    cql = f'type=page AND label="{label}" AND space="{space_key}"'
    url = f"https://lgucorp.atlassian.net/wiki/rest/api/content/search"
    r = requests.get(url, params={"cql": cql, "limit": limit}, auth=(CONFLUENCE_EMAIL, CONFLUENCE_TOKEN), verify=False)
    r.raise_for_status()
    return [{"id": i["id"], "title": i["title"], "url": i["_links"].get("webui")} for i in r.json().get("results", [])]

def delete_label(id, content):
    url = f"https://lgucorp.atlassian.net/wiki/rest/api/content/{id}/label/{content}"
    auth = (CONFLUENCE_EMAIL, CONFLUENCE_TOKEN)
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    try:
        response = requests.delete(url, auth=auth, headers=headers, verify=False)
        response.raise_for_status()
        print(f"Label '{content}' deleted successfully from content {id}")
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")


def add_comment(page_id: str, html: str):
    url = f"{SITE}/wiki/api/v2/footer-comments"
    payload = {
        "pageId": page_id,
        "body": {                 # storage 또는 atlas_doc_format 지원
            "representation": "storage",
            "value": html        # 예: "<p>자동 코멘트입니다.</p>"
        }
    }
    r = requests.post(url, json=payload, auth=(CONFLUENCE_EMAIL, CONFLUENCE_TOKEN), verify=False)
    r.raise_for_status()
    return r.json()

def has_review_comment(
        page_id: str,
        keyword: str
) -> bool:
    auth = (CONFLUENCE_EMAIL, CONFLUENCE_TOKEN)
    url = f"{SITE}/wiki/api/v2/pages/{page_id}/footer-comments"
    params = {"body-format": "storage"}

    while True:
        r = requests.get(url, params=params, auth=auth, verify=False)
        r.raise_for_status()
        data = r.json() if r.content else {}
        for comment in data.get("results", []):
            body_val = comment.get("body", {}).get("storage", {}).get("value", "")
            if keyword in body_val:
                return True

        # 페이지네이션 처리 (Link 헤더에 rel="next")
        link = r.headers.get("Link", "")
        next_url = None
        for part in link.split(","):
            if 'rel="next"' in part:
                start, end = part.find("<"), part.find(">")
                if start != -1 and end != -1 and end > start + 1:
                    next_url = part[start + 1 : end]
                break

        if not next_url:
            break
        url, params = next_url, None  # 다음 요청 준비

    return False

def get_comment(
        page_id: str
):
    comment_list = []
    auth = (CONFLUENCE_EMAIL, CONFLUENCE_TOKEN)
    url = f"{SITE}/wiki/api/v2/pages/{page_id}/footer-comments"
    params = {"body-format": "storage"}

    r = requests.get(url, params=params, auth=auth, verify=False)
    r.raise_for_status()
    data = r.json() if r.content else {}
    for comment in data.get("results", []):
        body_val = comment.get("body", {}).get("storage", {}).get("value", "")
        body_markdown = md(
            body_val,
            heading_style="ATX",   # <h2> -> "## " 스타일
            bullets="*",           # 목록 기호
            strip=["span", "div"], # 불필요 태그는 제거
            code_language=False    # <code> 언어 표시 X
        )
        comment_list.append(body_markdown)
    return comment_list