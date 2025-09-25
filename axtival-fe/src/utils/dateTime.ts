import { useState, useEffect } from "react";

/**
 * Date 객체를 한국어 형식으로 포맷팅합니다
 * @param date 포맷팅할 Date 객체
 * @returns 2025년 09월 24일 오전 7:50 형식의 문자열
 */
export const formatDateTime = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");

  const ampm = hours < 12 ? "오전" : "오후";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

  return `${year}년 ${month}월 ${day}일 ${ampm} ${displayHours}:${minutes}`;
};

/**
 * 현재 날짜를 한국어 형식으로 포맷팅합니다
 * @returns 2025년 09월 24일 오전 7:50 형식의 문자열
 */
export const formatCurrentDateTime = (): string => {
  return formatDateTime(new Date());
};

/**
 * 실시간으로 업데이트되는 현재 시간을 가져오는 hook
 * @param intervalMs 업데이트 간격 (밀리초, 기본값: 1000ms)
 * @returns 현재 시간 문자열
 */
export const useCurrentDateTime = (intervalMs: number = 1000): string => {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    // 초기값 설정
    setCurrentTime(formatCurrentDateTime());

    // 주기적 업데이트
    const interval = setInterval(() => {
      setCurrentTime(formatCurrentDateTime());
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return currentTime;
};
