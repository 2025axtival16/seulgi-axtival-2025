import sys
import pytz
import base64
import psycopg2
import requests
from psycopg2.extras import DictCursor
from datetime import datetime
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
import os
from dotenv import load_dotenv, find_dotenv
from urllib.parse import quote

sys.path.append(os.path.join(os.path.dirname(__file__), './layers/common-layer/python'))

load_dotenv(find_dotenv(".env", usecwd=True))  # 프로젝트 루트 .env 자동 탐색

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_DATABASE = os.getenv("DB_DATABASE", "")
DB_USERNAME = os.getenv("DB_USERNAME", "")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
GRAPH_BASE = os.getenv("GRAPH_BASE", "")
TENANT_ID = os.getenv("TENANT_ID", "")
CLIENT_ID = os.getenv("CLIENT_ID", "")
CLIENT_SECRET = os.getenv("CLIENT_SECRET", "")
SITE_ID = os.getenv("SITE_ID", "")
PARENT_ID = os.getenv("PARENT_ID", "")
DB_HOST = os.getenv("DB_HOST", "")
DB_PORT = os.getenv("DB_PORT", "")
DB_DATABASE = os.getenv("DB_DATABASE", "")
DB_USERNAME = os.getenv("DB_USERNAME", "")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
KEY = os.getenv("KEY", "")


def get_app_token() -> str:
    url = f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token"

    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }

    data = {
        "client_id": CLIENT_ID,
        "scope": "https://graph.microsoft.com/.default",  # Graph API 전체 권한
        "client_secret": CLIENT_SECRET,
        "grant_type": "client_credentials"
    }

    response = requests.post(url, headers=headers, data=data, verify=False)
    result = response.json()

    if "access_token" not in result:
        raise RuntimeError(f"MSAL token error: {result}")

    return result["access_token"]

def get_user_by_name(access_token, name):
    url = f"https://graph.microsoft.com/v1.0/users?$filter=startsWith(displayName,'{name}')"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, verify=False)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")

def get_user_by_email(access_token, email):
    url = f"https://graph.microsoft.com/v1.0/users/{email}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.get(url, headers=headers, verify=False)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")


def send_mail(access_token,email_list,content):
    seoul_tz = pytz.timezone('Asia/Seoul')
    today = datetime.now(seoul_tz).strftime('%Y%m%d')

    url = f"https://graph.microsoft.com/v1.0/users/{quote('jjssmmup@lguplus.co.kr')}/sendMail"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "message": {
            "subject": f"{today} 회의록 공유 드립니다.",
            "body": {
                "contentType": "HTML",
                "content": f"{today} 회의록 https://lgucorp.atlassian.net/wiki/spaces/MadangWorkAgent/pages/523900551/google+adk 에 저장되었습니다. 참고 부탁드립니다."
            },
            "toRecipients": [
                # {
                #     "emailAddress": {
                #         "address": "jihyeai@lguplus.co.kr"
                #     }
                # }
            ],
            "bccRecipients": [
            ]
        },
        "saveToSentItems": False
    }

    for email in email_list:
        payload['message']['toRecipients'].append({
            "emailAddress": {
                "address": f"{email}"
            }
        })

    response = requests.post(url, headers=headers, json=payload, verify=False)
    print(response.status_code, response.text)

def get_token_bot(bot_email):
    conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USERNAME, password=DB_PASSWORD, dbname=DB_DATABASE)
    cursor = conn.cursor(cursor_factory=DictCursor)

    try:
        select_query = f"SELECT u.code, pgp_sym_decrypt(auth.refresh_token, concat(u.email, '|', u.code)) as refresh_token FROM imuser u join imuserauth auth on auth.imuser_code = u.code where u.email = '{bot_email}'"
        cursor.execute(select_query)
        rows = cursor.fetchall()
        bot_code = rows[0]['code']
        refresh_token = decrypt(rows[0]['refresh_token'], KEY)

        # 2. MS access token
        token = get_access_token_by_refresh(refresh_token)
        access_token = token['access_token']
        renew_token = token['refresh_token']

        # 3. DB update token
        update_refresh_token(bot_code, bot_email, renew_token)

        return access_token
    except Exception as e:
        print("[error] get_token_bot:", e)
    finally:
        cursor.close()
        conn.close()


def decrypt(encrypted, crypt_key):
    try:
        # Base64 디코딩
        encrypted_bytes = base64.b64decode(encrypted)

        # IV, CipherText, Authentication Tag 분리
        IV = encrypted_bytes[:12]  # 일반적으로 IV는 12바이트
        tag = encrypted_bytes[-16:]  # 인증 태그는 마지막 16바이트
        cipher_text = encrypted_bytes[12:-16]  # 나머지는 암호화된 텍스트

        # AES-GCM 암호화 객체 생성
        cipher = Cipher(
            algorithms.AES(crypt_key.encode('utf-8')),
            modes.GCM(IV, tag),
            backend=default_backend()
        )
        decryptor = cipher.decryptor()

        # 복호화 실행
        decrypted_text = decryptor.update(cipher_text) + decryptor.finalize()

        return decrypted_text.decode('utf-8')
    except Exception as e:
        print(f"Crypto decrypt error: {str(e)}")

def get_access_token_by_refresh(refresh_token):
    url = f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token"
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token"
    }

    try:
        response = requests.post(url, headers=headers, data=data, verify=False)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")

def update_refresh_token(user_code, user_email, refresh_token):
    conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USERNAME, password=DB_PASSWORD, dbname=DB_DATABASE)
    cursor = conn.cursor(cursor_factory=DictCursor)

    try:
        update_query = "UPDATE imuserauth set refresh_token = pgp_sym_encrypt(%s, concat(%s, '|', %s)) where imuser_code = %s"
        enc_token = encrypt(refresh_token, KEY)
        cursor.execute(update_query, (enc_token, user_email, user_code, user_code))
        conn.commit()
    except Exception as e:
        print("[error] update_refresh_token:", e)
    finally:
        cursor.close()
        conn.close()


def encrypt(plain_text, crypt_key):
    try:
        # Define constants
        GCM_IV_LENGTH = 12
        GCM_TAG_LENGTH = 16

        # Generate Random IV
        IV = os.urandom(GCM_IV_LENGTH)

        # Create AES-GCM cipher
        cipher = Cipher(
            algorithms.AES(crypt_key.encode('utf-8')),
            modes.GCM(IV),
            backend=default_backend()
        )
        encryptor = cipher.encryptor()

        # Perform Encryption
        cipher_text = encryptor.update(plain_text.encode('utf-8')) + encryptor.finalize()

        # Combine IV and CipherText
        encrypted_bytes = IV + cipher_text + encryptor.tag

        # Encode result to Base64
        encrypted_base64 = base64.b64encode(encrypted_bytes).decode('utf-8')

        return encrypted_base64
    except Exception as e:
        print(f"Crypto encrypt Error: {e}")