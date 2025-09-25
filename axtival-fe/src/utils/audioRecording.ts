/**
 * 오디오 녹음 초기화 함수
 * @returns Promise<{success: boolean, mediaRecorder?: MediaRecorder, error?: string}>
 */
export const initializeAudioRecording = async (): Promise<{
  success: boolean;
  mediaRecorder?: MediaRecorder;
  error?: string;
}> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);

    return {
      success: true,
      mediaRecorder,
    };
  } catch (error) {
    console.error("오디오 초기화 실패:", error);
    return {
      success: false,
      error: "마이크 접근이 필요합니다.",
    };
  }
};

/**
 * MediaRecorder에 이벤트 핸들러를 설정합니다
 * @param mediaRecorder MediaRecorder 인스턴스
 * @param audioChunksRef 오디오 청크를 저장할 ref
 * @param onStop 녹음 종료 시 실행할 콜백 (audioBlob을 파라미터로 받음)
 */
export const setupMediaRecorderHandlers = (
  mediaRecorder: MediaRecorder,
  audioChunksRef: React.MutableRefObject<Blob[]>,
  onStop: (audioBlob: Blob) => void
) => {
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      audioChunksRef.current.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunksRef.current, {
      type: "audio/webm",
    });
    onStop(audioBlob);
    audioChunksRef.current = [];
  };
};

/**
 * 녹음 상태 관리를 위한 액션 타입들
 */
export type RecordingAction =
  | { type: "START_RECORDING" }
  | { type: "PAUSE_RECORDING" }
  | { type: "RESUME_RECORDING" }
  | { type: "STOP_RECORDING" }
  | { type: "RESET_TIME" }
  | { type: "INCREMENT_TIME" };

/**
 * 녹음 상태 인터페이스
 */
export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
}

/**
 * 녹음 상태 reducer
 */
export const recordingReducer = (
  state: RecordingState,
  action: RecordingAction
): RecordingState => {
  switch (action.type) {
    case "START_RECORDING":
      return {
        ...state,
        isRecording: true,
        isPaused: false,
        recordingTime: 0,
      };
    case "PAUSE_RECORDING":
      return {
        ...state,
        isPaused: true,
      };
    case "RESUME_RECORDING":
      return {
        ...state,
        isPaused: false,
      };
    case "STOP_RECORDING":
      return {
        ...state,
        isRecording: false,
        isPaused: false,
      };
    case "RESET_TIME":
      return {
        ...state,
        recordingTime: 0,
      };
    case "INCREMENT_TIME":
      return {
        ...state,
        recordingTime: state.recordingTime + 1,
      };
    default:
      return state;
  }
};
