import confluence as confluence
import common as common
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
import html2text


markdown_converter = html2text.HTML2Text()
SITE = "https://lgucorp.atlassian.net/wiki"

def main():
    label_title_list = ['기본기강화', 'AIWA주간회의']


    for label_title in label_title_list:
        #히스토리 리뷰 프롬프트 가져오기
        system_prompt_page_id = confluence.get_content_by_title(label_title + " 히스토리 프롬프트")['results'][0]['id']
        system_prompt_html = confluence.get_content(system_prompt_page_id)['body']['storage']['value']
        system_prompt = markdown_converter.handle(str(system_prompt_html))

        # 라벨 달린 페이지 목록 호출
        pages = confluence.search_pages_by_label_in_space(label_title + '완료', 'UMEET')

        if len(pages) > 0:
            user_prompt = ''
            url = ''
            for page in pages:
                data = confluence.get_content(page["id"])
                if not data:
                    continue
                user_prompt += (((data.get("body") or {}).get("storage") or {}).get("value") or "")
                url += f"""<p><a href="{SITE}{page['url']}">{page['title']}</a></p>\n"""

            answer = common.call_chatgpt(system_prompt, user_prompt)
            comment = answer
            comment += page['title']+' 요약\n\n'
            comment += url

            target_pages = confluence.search_pages_by_label_in_space(label_title, 'UMEET')
            for page in target_pages:
                confluence.add_comment(page["id"], comment)


if __name__ == "__main__":
    main()

