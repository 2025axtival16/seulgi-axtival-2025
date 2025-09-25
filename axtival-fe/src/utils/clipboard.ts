/**
 * 텍스트를 클립보드에 복사합니다
 * @param text 복사할 텍스트
 * @returns 복사 성공 여부
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // 최신 브라우저에서 지원하는 Clipboard API 사용
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // 구형 브라우저를 위한 fallback
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const result = document.execCommand("copy");
    document.body.removeChild(textArea);
    return result;
  } catch (error) {
    console.error("클립보드 복사 실패:", error);
    return false;
  }
};

/**
 * 회의 내용을 텍스트 형태로 포맷팅합니다
 * @param title 회의 제목
 * @param participants 참가자 목록
 * @param transcript 전사 내용
 * @param currentTime 현재 시간
 * @returns 포맷된 회의 노트 텍스트
 */
interface TranscriptItem {
  id: string;
  speaker: string;
  content: string;
  timestamp: Date;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  department?: string;
}

export const formatMeetingNotes = (
  title: string,
  participants: Participant[],
  transcript: TranscriptItem[],
  currentTime: string,
  summary: string[]
): string => {
  let notes = `# ${title}\n\n`;

  // 회의 시간
  notes += `### 📅 회의 시간: ${currentTime}\n\n`;

  // 참가자
  if (participants.length > 0) {
    notes += `### 👥 참가자:\n`;
    participants.forEach((participant) => {
      notes += `- ${participant.name}`;
      if (participant.department) {
        notes += ` (${participant.department})`;
      }
      notes += ` - ${participant.email}\n`;
    });
    notes += `\n`;
  }

  // 회의 내용
  if (transcript.length > 0) {
    notes += `### 📝 회의 내용:\n\n`;
    transcript.forEach((item, index) => {
      const timeStr = item.timestamp.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      notes += `${index + 1}. [${timeStr}] ${item.speaker}: ${item.content}\n`;
    });
  }

  // 회의 요약
  if (summary.length > 0) {
    notes += `### 📝 회의 요약:\n\n`;
    summary.forEach((item, index) => {
      notes += `${index + 1}. ${item}\n`;
    });
  }

  return notes;
};
