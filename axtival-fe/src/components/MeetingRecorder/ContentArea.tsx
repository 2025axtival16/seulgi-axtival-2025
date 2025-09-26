import React, { useRef, useEffect } from "react";
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
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const prevContentsLengthRef = useRef<number>(0);
    const savedScrollPositionRef = useRef<number>(0);

    // contents가 변경될 때 스크롤 위치 관리
    useEffect(() => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer || !contents) return;

      const currentLength = contents.length;
      const prevLength = prevContentsLengthRef.current;

      if (currentLength > prevLength) {
        // 새로운 요약이 추가된 경우: 맨 아래로 스크롤 (채팅처럼)
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }, 50);
      } else if (currentLength === prevLength) {
        // 같은 개수지만 내용이 변경된 경우: 기존 위치 유지
        setTimeout(() => {
          scrollContainer.scrollTop = savedScrollPositionRef.current;
        }, 50);
      }

      prevContentsLengthRef.current = currentLength;
    }, [contents]);

    // 스크롤 위치 저장
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      savedScrollPositionRef.current = e.currentTarget.scrollTop;
    };

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
                  ref={scrollContainerRef}
                  onScroll={handleScroll}
                  style={{
                    maxHeight: "300px",
                    overflowY: "auto",
                    overflowX: "hidden",
                    scrollBehavior: "smooth",
                  }}
                >
                  {contents.map((summary, index) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: "12px",
                        padding: "12px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        border: "1px solid #e9ecef",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#6c757d",
                          marginBottom: "8px",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            backgroundColor: "#6e5dce",
                            color: "white",
                            borderRadius: "50%",
                            width: "20px",
                            height: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            fontWeight: "700",
                          }}
                        >
                          {index + 1}
                        </span>
                        요약 #{index + 1}
                        <span
                          style={{
                            color: "#adb5bd",
                            fontSize: "11px",
                            marginLeft: "auto",
                          }}
                        >
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          lineHeight: "1.6",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          color: "#495057",
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
