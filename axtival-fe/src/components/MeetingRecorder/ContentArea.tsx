import React from "react";
import { contentArea, contentCard } from "../../styles/meetingRecorder.css";
import RecordingIndicator from "./RecordingIndicator";

interface ContentAreaProps {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  contents?: string[];
}

const ContentArea: React.FC<ContentAreaProps> = React.memo(
  ({ isRecording, isPaused, recordingTime, contents }) => {
    return (
      <div className={contentArea}>
        <div className={contentCard}>
          <div
            style={{
              marginBottom: "24px",
            }}
          >
            {contents && contents.length > 0 ? (
              <div>
                <h3
                  style={{
                    marginBottom: "16px",
                    fontSize: "18px",
                    fontWeight: "600",
                  }}
                >
                  실시간 회의 요약
                </h3>

                <div
                  style={{
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  {contents.map((summary, index) => (
                    <div
                      key={`summary-${index}-${summary.slice(0, 20)}`}
                      style={{
                        marginBottom: "12px",
                        padding: "12px",
                        backgroundColor: "#f8f9fa",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "15px",
                          color: "#666",
                          marginBottom: "4px",
                        }}
                      >
                        요약 #{index + 1}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          lineHeight: "1.5",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {summary}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                style={{ color: "#999", textAlign: "center", padding: "20px" }}
              >
                실시간 요약이 여기에 표시됩니다
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            marginRight: "40px",
          }}
        >
          <RecordingIndicator
            isRecording={isRecording}
            isPaused={isPaused}
            recordingTime={recordingTime}
          />
        </div>
      </div>
    );
  }
);

ContentArea.displayName = "ContentArea";

export default ContentArea;
