import React from "react";
import {
  recordingIndicator,
  recordingIndicatorActive,
  recordingIndicatorPaused,
} from "../../styles/meetingRecorder.css";
import { formatTime } from "../../utils/timeFormat";

interface RecordingIndicatorProps {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
}

const RecordingIndicator: React.FC<RecordingIndicatorProps> = ({
  isRecording,
  isPaused,
  recordingTime,
}) => {
  if (!isRecording) {
    return null;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        className={
          isPaused ? recordingIndicatorPaused : recordingIndicatorActive
        }
      />
      <span style={{ fontSize: "14px", color: "#666" }}>
        {isPaused ? "일시정지" : "녹음 중"} • {formatTime(recordingTime)}
      </span>
    </div>
  );
};

export default RecordingIndicator;
