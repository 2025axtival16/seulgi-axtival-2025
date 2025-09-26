import { API_BASE_URL } from "../constants/KEY";

/**
 * API 호출을 위한 유틸리티 함수
 * @param endpoint - API 엔드포인트 경로 (예: "/api/summary", "/api/rag/chat")
 * @param options - fetch options
 * @returns fetch Response
 */
export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = `${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  return fetch(url, defaultOptions);
};

/**
 * POST 요청을 위한 헬퍼 함수
 * @param endpoint - API 엔드포인트 경로
 * @param data - 전송할 데이터
 * @param options - 추가 fetch options
 * @returns fetch Response
 */
export const apiPost = async (
  endpoint: string,
  data: any,
  options: RequestInit = {}
): Promise<Response> => {
  return apiCall(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * GET 요청을 위한 헬퍼 함수
 * @param endpoint - API 엔드포인트 경로
 * @param options - 추가 fetch options
 * @returns fetch Response
 */
export const apiGet = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  return apiCall(endpoint, {
    method: "GET",
    ...options,
  });
};
