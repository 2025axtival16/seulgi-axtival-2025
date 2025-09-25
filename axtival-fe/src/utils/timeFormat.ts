/**
 * 초 단위 시간을 MM:SS 형식으로 포맷팅합니다
 * @param seconds 초 단위 시간
 * @returns MM:SS 형식의 문자열 (예: "3:45", "12:00")
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * 밀리초를 시:분:초 형식으로 포맷팅합니다
 * @param milliseconds 밀리초
 * @returns HH:MM:SS 형식의 문자열
 */
export const formatDuration = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

/**
 * Date 객체를 HH:MM:SS 형태로 포맷
 * @param date Date 객체
 * @returns HH:MM:SS 형식의 문자열
 */
export const formatTimeFromDate = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};
