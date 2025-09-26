"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Send,
  FileText,
  Archive,
  Mail,
  Play,
  Clock,
} from "lucide-react";
import { sprinkles } from "../../styles/sprinkles.css";
import { API_BASE_URL } from "../../constants/KEY";
import { formatMeetingNotes } from "@/utils/clipboard";
import { formatDateTime } from "@/utils/dateTime";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

interface TranscriptItem {
  id: string;
  speaker: string;
  content: string;
  timestamp: Date;
}

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface MeetingEndModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMeetingComplete: (summary: string, followUps: string[]) => void;
  meetingTitle: string;
  participants: Employee[];
  transcript: TranscriptItem[];
  logs: string[];
  audioBlob?: Blob;
  selectedLabel?: string;
  recordingStartTime?: Date | null;
  realTimeSummary?: string[];
}

interface ProcessingStatus {
  audioSaved: boolean;
  summaryGenerated: boolean;
  shareSaved: boolean;
}

const MeetingEndModal: React.FC<MeetingEndModalProps> = ({
  isOpen,
  onClose,
  onMeetingComplete,
  meetingTitle,
  participants,
  transcript,
  logs,
  audioBlob,
  selectedLabel,
  recordingStartTime,
  realTimeSummary = [],
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<ProcessingStatus>({
    audioSaved: false,
    summaryGenerated: false,
    shareSaved: false,
  });
  const [summary, setSummary] = useState("");
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [confluenceUrl, setConfluenceUrl] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(2);
  const [errorCountdown, setErrorCountdown] = useState(5);

  // shareSaved가 true가 되면 2초 후 모달 자동 닫기
  useEffect(() => {
    if (status.shareSaved && isOpen) {
      let timeLeft = 5;
      setCountdown(timeLeft);

      const countdownInterval = setInterval(() => {
        timeLeft -= 1;
        setCountdown(timeLeft);

        if (timeLeft <= 0) {
          clearInterval(countdownInterval);
          // 회의 완료 데이터 전달하고 모달 닫기
          onMeetingComplete(summary, followUps);
        }
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [
    status.shareSaved,
    isOpen,
    onClose,
    onMeetingComplete,
    summary,
    followUps,
  ]);

  // 에러 발생 시 5초 후 모달 자동 닫기
  useEffect(() => {
    if (error && isOpen) {
      let timeLeft = 5;
      setErrorCountdown(timeLeft);

      const errorCountdownInterval = setInterval(() => {
        timeLeft -= 1;
        setErrorCountdown(timeLeft);

        if (timeLeft <= 0) {
          clearInterval(errorCountdownInterval);
          onClose();
        }
      }, 1000);

      return () => clearInterval(errorCountdownInterval);
    }
  }, [error, isOpen, onClose]);

  const processMeetingEnd = async () => {
    setIsProcessing(true);
    setError("");

    try {
      // 음성 파일 저장 (일단 바로 true로 설정)
      setStatus((prev) => ({ ...prev, audioSaved: true }));

      // 잠시 대기 후 요약 시작 (순차적 표시를 위함)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 실제 음성 파일 저장이 필요한 경우 아래 코드 사용
      // if (audioBlob) {
      //   const formData = new FormData();
      //   formData.append(
      //     "audio",
      //     audioBlob,
      //     `${meetingTitle}_${Date.now()}.webm`
      //   );
      //   formData.append("meetingTitle", meetingTitle);

      //   const audioResponse = await fetch("/api/meeting/save-audio", {
      //     method: "POST",
      //     body: formData,
      //   });

      //   if (audioResponse.ok) {
      //     setStatus((prev) => ({ ...prev, audioSaved: true }));
      //   } else {
      //     throw new Error("음성 파일 저장 실패");
      //   }
      // }

      // 회의록 요약 및 follow-up 생성
      const summaryResponse = await fetch("/api/note/summaryall", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: meetingTitle,
          text: logs.join("\n"),
        }),
      });

      const summaryData = await summaryResponse.json();
      if (summaryResponse.ok) {
        setSummary(summaryData.answer);
        setFollowUps(summaryData.followUps || []);
        setStatus((prev) => ({ ...prev, summaryGenerated: true }));

        // 잠시 대기 후 Confluence 저장 시작 (순차적 표시를 위함)
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        throw new Error("요약 생성 실패");
      }

      // formatMeetingNotes와 summaryData.answer를 합쳐서 완전한 회의록 생성
      const meetingTime = recordingStartTime
        ? formatDateTime(recordingStartTime)
        : formatDateTime(new Date());

      const formattedNotes = formatMeetingNotes(
        meetingTitle,
        participants,
        transcript,
        meetingTime,
        realTimeSummary // 실시간 요약 사용
      );

      // 완전한 회의록 = 포맷된 노트 + AI 요약
      const completeContent =
        formattedNotes + `\n\n### 🤖 전체 회의 요약:\n\n${summaryData.answer}`;

      // Confluence에 저장 및 이메일 전송
      const shareResponse = await fetch(`/api/note/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: selectedLabel || "",
          participants: participants.map((p) => p.email),
          title: meetingTitle,
          content: completeContent,
        }),
      });

      if (shareResponse.ok) {
        setStatus((prev) => ({ ...prev, shareSaved: true }));
      } else {
        throw new Error("공유 실패");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "처리 중 오류가 발생했습니다."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "20px",
          padding: "32px",
          maxWidth: "520px",
          width: "90%",
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow:
            "0 24px 60px rgba(0, 0, 0, 0.15), 0 8px 24px rgba(0, 0, 0, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          position: "relative",
        }}
      >
        {!isProcessing && !status.audioSaved && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "32px",
            }}
          >
            {/* Header */}
            <div
              style={{
                textAlign: "center",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  background: "linear-gradient(135deg, #e6007e, #ff4081)",
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  boxShadow: "0 8px 24px rgba(230, 0, 126, 0.3)",
                }}
              >
                <Clock color="white" size={28} />
              </div>
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  margin: "0 0 12px 0",
                  color: "#1a1a1a",
                }}
              >
                회의가 종료되었습니다
              </h2>
              <p
                style={{
                  color: "#666",
                  fontSize: "16px",
                  margin: "0",
                }}
              >
                다음 작업들을 자동으로 수행하시겠습니까?
              </p>
            </div>

            {/* Task Cards */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                width: "100%",
                maxWidth: "400px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px 20px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "12px",
                  border: "1px solid #e9ecef",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#4285f4",
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <FileText color="white" size={20} />
                </div>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: "500",
                    color: "#2c3e50",
                  }}
                >
                  회의록 요약 및 follow-up 사항 도출
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px 20px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "12px",
                  border: "1px solid #e9ecef",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#34a853",
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Archive color="white" size={20} />
                </div>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: "500",
                    color: "#2c3e50",
                  }}
                >
                  Confluence에 저장
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px 20px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "12px",
                  border: "1px solid #e9ecef",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#ff6b35",
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Mail color="white" size={20} />
                </div>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: "500",
                    color: "#2c3e50",
                  }}
                >
                  참석자들에게 이메일 전송
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                width: "100%",
                maxWidth: "300px",
              }}
            >
              <button
                onClick={processMeetingEnd}
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #e6007e, #ff4081)",
                  color: "white",
                  border: "none",
                  padding: "16px 24px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "15px",
                  boxShadow: "0 4px 16px rgba(230, 0, 126, 0.3)",
                  transition: "all 0.2s ease-in-out",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 24px rgba(230, 0, 126, 0.4)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 16px rgba(230, 0, 126, 0.3)";
                }}
              >
                <Play
                  size={18}
                  style={{ marginRight: "8px", display: "inline" }}
                />
                작업 수행
              </button>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  color: "#6c757d",
                  border: "2px solid #e9ecef",
                  background: "white",
                  padding: "16px 24px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "15px",
                  transition: "all 0.2s ease-in-out",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = "#6c757d";
                  e.currentTarget.style.color = "#495057";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = "#e9ecef";
                  e.currentTarget.style.color = "#6c757d";
                }}
              >
                나중에 하기
              </button>
            </div>
          </div>
        )}

        {(isProcessing ||
          status.audioSaved ||
          status.summaryGenerated ||
          status.shareSaved) && (
          <div>
            <div>
              {/* Step 1: 회의록 요약 생성 (항상 표시) */}
              <ProcessingStep
                title="회의록 요약 생성"
                completed={status.summaryGenerated}
                inProgress={status.audioSaved && !status.summaryGenerated}
              />

              {/* Step 2: Confluence 저장 (요약 완료 후 표시) */}
              {status.summaryGenerated && (
                <ProcessingStep
                  title="Confluence 저장 및 이메일 전송"
                  completed={status.shareSaved}
                  inProgress={status.summaryGenerated && !status.shareSaved}
                />
              )}
            </div>

            {summary && status.summaryGenerated && (
              <div
                style={{
                  marginBottom: "20px",
                  animation: "slideIn 0.5s ease-out",
                  transform: "translateY(0)",
                  opacity: 1,
                  marginTop: "12px",
                }}
              >
                <h3
                  style={{
                    marginBottom: "12px",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1e293b",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  📝 회의 요약
                </h3>
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#f8fafc",
                    border: "2px solid #e2e8f0",
                    borderRadius: "12px",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    color: "#334155",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          h1: ({ children }) => (
                            <h1
                              style={{
                                fontSize: "1.2em",
                                fontWeight: "bold",
                                margin: "6px 0 4px 0",
                                color: "inherit",
                              }}
                            >
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2
                              style={{
                                fontSize: "1.1em",
                                fontWeight: "bold",
                                margin: "4px 0 2px 0",
                                color: "inherit",
                              }}
                            >
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3
                              style={{
                                fontSize: "1.05em",
                                fontWeight: "bold",
                                margin: "2px 0 1px 0",
                                color: "inherit",
                              }}
                            >
                              {children}
                            </h3>
                          ),
                          p: ({ children }) => (
                            <p
                              style={{
                                margin: "1px 0",
                                lineHeight: "1.4",
                              }}
                            >
                              💬 {children}
                            </p>
                          ),
                          code: ({
                            children,
                            ...props
                          }: { children: React.ReactNode } & any) =>
                            props.inline ? (
                              <code
                                style={{
                                  backgroundColor: "#f1f5f9",
                                  padding: "1px 3px",
                                  borderRadius: "3px",
                                  fontSize: "0.85em",
                                  fontFamily: "monospace",
                                }}
                                {...props}
                              >
                                {children}
                              </code>
                            ) : (
                              <code
                                style={{
                                  display: "block",
                                  backgroundColor: "#f8fafc",
                                  padding: "8px",
                                  borderRadius: "4px",
                                  fontSize: "0.85em",
                                  fontFamily: "monospace",
                                  overflow: "auto",
                                  border: "1px solid #e2e8f0",
                                  margin: "4px 0",
                                }}
                                {...props}
                              >
                                {children}
                              </code>
                            ),
                          blockquote: ({ children }) => (
                            <blockquote
                              style={{
                                borderLeft: "3px solid #6366f1",
                                paddingLeft: "12px",
                                margin: "4px 0",
                                fontStyle: "italic",
                                color: "#64748b",
                              }}
                            >
                              {children}
                            </blockquote>
                          ),
                          ul: ({ children }) => (
                            <ul
                              style={{
                                paddingLeft: "16px",
                                margin: "2px 0",
                              }}
                            >
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol
                              style={{
                                paddingLeft: "16px",
                                margin: "2px 0",
                              }}
                            >
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li
                              style={{
                                margin: "1px 0",
                                lineHeight: "1.3",
                              }}
                            >
                              {children}
                            </li>
                          ),
                          table: ({ children }) => (
                            <table
                              style={{
                                borderCollapse: "collapse",
                                width: "100%",
                                margin: "4px 0",
                                border: "1px solid #e2e8f0",
                                fontSize: "0.9em",
                              }}
                            >
                              {children}
                            </table>
                          ),
                          th: ({ children }) => (
                            <th
                              style={{
                                border: "1px solid #e2e8f0",
                                padding: "6px 8px",
                                backgroundColor: "#f8fafc",
                                fontWeight: "600",
                              }}
                            >
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td
                              style={{
                                border: "1px solid #e2e8f0",
                                padding: "6px 8px",
                              }}
                            >
                              {children}
                            </td>
                          ),
                        }}
                      >
                        {summary}
                      </ReactMarkdown>
                </div>
              </div>
            )}

            {followUps.length > 0 && status.summaryGenerated && (
              <div style={{ marginBottom: "20px" }}>
                <h3
                  style={{
                    marginBottom: "12px",
                    fontSize: "16px",
                    fontWeight: "600",
                  }}
                >
                  Follow-up 사항
                </h3>
                <ul style={{ paddingLeft: "20px" }}>
                  {followUps.map((item, index) => (
                    <li
                      key={index}
                      style={{ marginBottom: "8px", fontSize: "14px" }}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {confluenceUrl && (
              <div style={{ marginBottom: "20px" }}>
                <a
                  href={confluenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#2196F3",
                    textDecoration: "none",
                  }}
                >
                  <ExternalLink size={16} />
                  Confluence 페이지 보기
                </a>
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#fef2f2",
                  border: "2px solid #fca5a5",
                  borderRadius: "12px",
                  marginBottom: "20px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>⚠️</div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#dc2626",
                    marginBottom: "8px",
                  }}
                >
                  오류가 발생했습니다
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#991b1b",
                    marginBottom: "12px",
                    lineHeight: "1.5",
                  }}
                >
                  {error}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#dc2626",
                    backgroundColor: "rgba(220, 38, 38, 0.1)",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    display: "inline-block",
                  }}
                >
                  {errorCountdown}초 후 자동으로 닫힙니다
                </div>
              </div>
            )}

            {/* 최종 완료 메시지 (모든 단계 완료 후 표시) */}
            {status.shareSaved && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#f0f9ff",
                    borderRadius: "12px",
                    border: "2px solid #bae6fd",
                    textAlign: "center",
                    width: "100%",
                  }}
                >
                  <CheckCircle
                    size={32}
                    style={{ color: "#10b981", marginBottom: "8px" }}
                  />
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#065f46",
                      marginBottom: "4px",
                    }}
                  >
                    🎉 모든 작업이 완료되었습니다!
                  </div>
                  <div style={{ fontSize: "14px", color: "#0369a1" }}>
                    {countdown}초 후 자동으로 닫힙니다
                  </div>
                </div>

                <button
                  onClick={() => onMeetingComplete(summary, followUps)}
                  className={sprinkles({
                    backgroundColor: "primary",
                    color: "on_primary",
                    padding: 12,
                    borderRadius: "medium",
                  })}
                  style={{
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "500",
                    width: "100%",
                  }}
                >
                  지금 닫기
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ProcessingStep: React.FC<{
  title: string;
  completed: boolean;
  inProgress: boolean;
}> = ({ title, completed, inProgress }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "8px 0",
      animation: "slideIn 0.5s ease-out",
    }}
  >
    {completed ? (
      <CheckCircle size={20} style={{ color: "#4CAF50" }} />
    ) : inProgress ? (
      <div
        style={{
          width: "20px",
          height: "20px",
          border: "2px solid #f3f3f3",
          borderTop: "2px solid #2196F3",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
    ) : (
      <div
        style={{
          width: "20px",
          height: "20px",
          border: "2px solid #ddd",
          borderRadius: "50%",
        }}
      />
    )}
    <span
      style={{
        fontSize: "14px",
        color: completed ? "#4CAF50" : inProgress ? "#2196F3" : "#666",
      }}
    >
      {title}
    </span>
  </div>
);

export default MeetingEndModal;

// CSS 스타일 추가
const styles = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// 전역 스타일 주입
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
