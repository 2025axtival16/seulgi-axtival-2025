"use client";

import React, { useState } from "react";
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
  meetingTitle: string;
  participants: Employee[];
  transcript: TranscriptItem[];
  logs: string[];
  audioBlob?: Blob;
  selectedLabel?: string;
}

interface ProcessingStatus {
  audioSaved: boolean;
  summaryGenerated: boolean;
  confluenceSaved: boolean;
  emailSent: boolean;
}

const MeetingEndModal: React.FC<MeetingEndModalProps> = ({
  isOpen,
  onClose,
  meetingTitle,
  participants,
  transcript,
  logs,
  audioBlob,
  selectedLabel,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<ProcessingStatus>({
    audioSaved: false,
    summaryGenerated: false,
    confluenceSaved: false,
    emailSent: false,
  });
  const [summary, setSummary] = useState("");
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [confluenceUrl, setConfluenceUrl] = useState("");
  const [error, setError] = useState("");

  const processMeetingEnd = async () => {
    setIsProcessing(true);
    setError("");

    try {
      // 음성 파일 저장
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
      } else {
        throw new Error("요약 생성 실패");
      }

      // Confluence에 저장 및 이메일 전송
      const shareResponse = await fetch(`${API_BASE_URL}/api/note/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: selectedLabel || "",
          participants: participants.map((p) => p.email),
          title: meetingTitle,
          content: summaryData.answer,
        }),
      });

      if (shareResponse.ok) {
        setStatus((prev) => ({ ...prev, shareSent: true }));
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

        {(isProcessing || status.audioSaved) && (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <ProcessingStep
                title="회의록 요약 생성"
                completed={status.summaryGenerated}
                inProgress={status.audioSaved && !status.summaryGenerated}
              />
              <ProcessingStep
                title="Confluence 저장"
                completed={status.confluenceSaved}
                inProgress={status.summaryGenerated && !status.confluenceSaved}
              />
              <ProcessingStep
                title="이메일 전송"
                completed={status.emailSent}
                inProgress={status.confluenceSaved && !status.emailSent}
              />
            </div>

            {summary && (
              <div style={{ marginBottom: "20px" }}>
                <h3
                  style={{
                    marginBottom: "12px",
                    fontSize: "16px",
                    fontWeight: "600",
                  }}
                >
                  회의 요약
                </h3>
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "6px",
                    fontSize: "14px",
                    lineHeight: "1.5",
                  }}
                >
                  {summary}
                </div>
              </div>
            )}

            {followUps.length > 0 && (
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
                  padding: "12px",
                  backgroundColor: "#ffebee",
                  color: "#c62828",
                  borderRadius: "6px",
                  marginBottom: "20px",
                  fontSize: "14px",
                }}
              >
                {error}
              </div>
            )}

            {status.emailSent && (
              <button
                onClick={onClose}
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
                완료
              </button>
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
