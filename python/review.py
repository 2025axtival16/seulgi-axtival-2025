import confluence as confluence
import common as common
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
import html2text


markdown_converter = html2text.HTML2Text()

def main():
    label_title_list = ['기본기강화', 'AIWA주간회의']

    for label_title in label_title_list:
        # 라벨 달린 페이지 목록 호출
        pages = confluence.search_pages_by_label_in_space(label_title, 'UMEET')

        # 회의록 리뷰 프롬프트 가져오기
        system_prompt_page_id = confluence.get_content_by_title(label_title + " 리뷰 프롬프트")['results'][0]['id']
        system_prompt_html = confluence.get_content(system_prompt_page_id)['body']['storage']['value']
        system_prompt = markdown_converter.handle(str(system_prompt_html))

        for page in pages:
            data = confluence.get_content(page["id"])
            if not data:
                continue

            # 리뷰할 페이지 내용 가져오기
            user_prompt = (((data.get("body") or {}).get("storage") or {}).get("value") or "")

            # 리뷰하고 댓글달기
            answer = common.call_chatgpt(system_prompt, user_prompt)
            confluence.add_comment(page["id"], answer)

            # 라벨 제거하고 완료 라벨 달기
            confluence.delete_label(page["id"], label_title)
            confluence.post_label(page["id"], label_title + '완료')


if __name__ == "__main__":
    main()

