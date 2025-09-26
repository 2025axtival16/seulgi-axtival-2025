"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  container,
  mainContent,
  rightPanel,
  rightPanelContent,
  rightPanelToggleButton,
  rightPanelToggleButtonOpen,
  rightPanelToggleButtonClosed,
  rightPanelExpanded,
  rightPanelCollapsed,
  sectionContainer,
  sectionTitle,
} from "../styles/meetingRecorder.css";
import Sidebar from "../components/MeetingRecorder/Sidebar";
import Header from "../components/MeetingRecorder/Header";
import ContentArea from "../components/MeetingRecorder/ContentArea";
import BottomControls from "../components/MeetingRecorder/BottomControls";
import ParticipantManager from "../components/MeetingRecorder/ParticipantManager";
import TranscriptionArea from "../components/MeetingRecorder/TranscriptionArea";
import MeetingEndModal from "../components/MeetingRecorder/MeetingEndModal";
import RAGManager from "../components/MeetingRecorder/RAGManager";
import RAGChat from "../components/MeetingRecorder/RAGChat";
import LeftPannel from "../components/MeetingRecorder/LeftPannel";
import { formatTime } from "../utils/timeFormat";
import {
  initializeAudioRecording,
  setupMediaRecorderHandlers,
} from "../utils/audioRecording";
import { copyToClipboard, formatMeetingNotes } from "../utils/clipboard";
import { useCurrentDateTime } from "../utils/dateTime";
import Toast from "../components/Toast/Toast";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { Employee, TranscriptItem } from "../constants/types";

const MeetingRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(
    null
  );
  const [title, setTitle] = useState("Untitled");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // 새로운 상태
  const [participants, setParticipants] = useState<Employee[]>([]);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [showEndModal, setShowEndModal] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [vectorStoreId, setVectorStoreId] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const [realTimeSummary, setRealTimeSummary] = useState<string[]>([]);

  // Right Panel 토글 상태
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // Header 탭 상태 (대화 기록 vs 스크립트)
  const [selectedTab, setSelectedTab] = useState<"conversation" | "script">(
    "conversation"
  );

  // 토스트 상태
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // 회의 완료 상태 및 요약 데이터
  const [isMeetingCompleted, setIsMeetingCompleted] = useState(false);
  const [meetingSummary, setMeetingSummary] = useState("");
  const [meetingFollowUps, setMeetingFollowUps] = useState<string[]>([]);

  // 미디어 레코더 관련
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused]);

  const handleStartRecording = async () => {
    const result = await initializeAudioRecording();
    if (!result.success) {
      alert(result.error || "오디오 초기화에 실패했습니다.");
      return;
    }

    if (result.mediaRecorder) {
      // 이벤트 핸들러 설정
      setupMediaRecorderHandlers(
        result.mediaRecorder,
        audioChunksRef,
        setAudioBlob
      );

      mediaRecorderRef.current = result.mediaRecorder;
      result.mediaRecorder.start();
    }

    // 🔄 데이터 보존 - 회의 중 재시작하더라도 기존 데이터 유지
    const hasExistingSummary = realTimeSummary.length > 0;
    const hasExistingTranscript = transcript.length > 0;

    if (hasExistingSummary || hasExistingTranscript) {
      console.log(
        "🔄 재시작: 기존 데이터 유지 중...",
        "요약:",
        realTimeSummary.length,
        "개",
        "전사:",
        transcript.length,
        "개"
      );
    }

    setIsRecording(true);
    setIsPaused(false);
    setRecordingTime(0);
    // 기존 데이터는 유지하고 새로운 데이터만 추가
    // setTranscript([]);  // 제거 - 기존 전사 유지
    // setLogs([]);        // 제거 - 기존 로그 유지
    // setRealTimeSummary([]); // 제거 - 기존 요약 유지
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);

    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
      } else {
        mediaRecorderRef.current.pause();
      }
    }
  };

  const currentDateTime = useCurrentDateTime();

  const handleCopyNotes = async () => {
    const notes = formatMeetingNotes(
      title,
      participants,
      transcript,
      currentDateTime,
      realTimeSummary
    );

    const success = await copyToClipboard(notes);
    if (success) {
      setToastMessage("노트가 복사되었습니다");
      setShowToast(true);
    } else {
      setToastMessage("복사에 실패했습니다");
      setShowToast(true);
    }
  };

  const handleStop = () => {
    console.log("⏹️ 녹음 중지 (상태 유지)");
    setIsRecording(false);
    setIsPaused(false);

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    setShowEndModal(true);
  };

  const handleTitleEdit = () => {
    setIsEditingTitle(true);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
  };

  const handleTitleSave = (
    e:
      | React.KeyboardEvent<HTMLInputElement>
      | React.FocusEvent<HTMLInputElement>
  ) => {
    if (
      e.type === "blur" ||
      (e.type === "keydown" && (e as React.KeyboardEvent).key === "Enter")
    ) {
      setIsEditingTitle(false);
    }
  };

  const handleToggleRightPanel = () => {
    setIsRightPanelOpen(!isRightPanelOpen);
  };

  // 회의 완료 핸들러
  const handleMeetingComplete = (summary: string, followUps: string[]) => {
    setMeetingSummary(summary);
    setMeetingFollowUps(followUps);
    setIsMeetingCompleted(true);
    setShowEndModal(false);
  };

  // 새 회의 시작 핸들러
  const handleStartNewMeeting = () => {
    setIsMeetingCompleted(false);
    setMeetingSummary("");
    setMeetingFollowUps([]);
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setTranscript([]);
    setLogs([]);
    setRealTimeSummary([]);
    setTitle("Untitled");
    setParticipants([]);
  };

  // 녹음 시작 시간 설정 콜백
  const handleRecordingStart = (startTime: Date) => {
    setRecordingStartTime(startTime);
  };

  // 실시간 요약 추가 콜백
  const handleRealTimeSummaryUpdate = (summary: string) => {
    console.log("🔥 새로운 요약 업데이트:", summary);
    setRealTimeSummary((prevSummaries) => {
      const newSummaries = [...prevSummaries, summary];
      console.log("📝 현재 요약 배열:", newSummaries);
      console.log("📊 요약 개수:", newSummaries.length);
      return newSummaries;
    });
  };

  // 로그 업데이트 콜백
  const handleLogsUpdate = (newLogs: string[]) => {
    setLogs(newLogs);
  };

  return (
    <div className={container}>
      {/* Right Panel Toggle Button */}
      <button
        className={
          isRightPanelOpen
            ? rightPanelToggleButtonOpen
            : rightPanelToggleButtonClosed
        }
        onClick={handleToggleRightPanel}
        title={isRightPanelOpen ? "RAG 패널 닫기" : "RAG 패널 열기"}
      >
        {isRightPanelOpen ? (
          <PanelRightClose size={20} />
        ) : (
          <PanelRightOpen size={20} />
        )}
      </button>

      {/* 히스토리 요약 영역 */}
      <LeftPannel labelName={selectedLabel} />

      {/* 메인 회의 영역 */}
      <div className={mainContent}>
        <Header
          title={title}
          isEditingTitle={isEditingTitle}
          recordingTime={recordingTime}
          recordingStartTime={recordingStartTime}
          isMeetingCompleted={isMeetingCompleted}
          selectedTab={selectedTab}
          onTitleChange={handleTitleChange}
          onTitleEdit={handleTitleEdit}
          onTitleSave={handleTitleSave}
          onCopyNotes={handleCopyNotes}
          onTabChange={setSelectedTab}
        />

        {/* 탭에 따른 조건부 렌더링 */}
        {isMeetingCompleted && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              margin: "0 24px 18px 24px",
            }}
          >
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#1e293b",
              }}
            >
              🎉 회의가 완료되었습니다!
            </h2>
            <button
              onClick={handleStartNewMeeting}
              style={{
                background: " #6e5dce",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 12px rgba(110, 93, 206, 0.3)",
              }}
            >
              🆕 새 회의 시작
            </button>
          </div>
        )}

        {/* 스크립트 탭: 회의 요약 및 후속 조치 */}
        {selectedTab === "script" && (
          <div className={sectionContainer}>
            {isMeetingCompleted ? (
              /* 회의 완료 후: 요약 및 후속 조치 표시 */
              <>
                {/* 회의 요약 */}
                {meetingSummary && (
                  <div style={{ marginBottom: "32px" }}>
                    <h3
                      style={{
                        fontSize: "20px",
                        fontWeight: "600",
                        marginBottom: "16px",
                        color: "#374151",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      📝 회의 요약
                    </h3>
                    <div
                      style={{
                        padding: "20px",
                        backgroundColor: "#f8fafc",
                        border: "2px solid #e2e8f0",
                        borderRadius: "12px",
                        fontSize: "15px",
                        lineHeight: "1.7",
                        color: "#334155",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                      }}
                    >
                      {meetingSummary}
                    </div>
                  </div>
                )}

                {/* 후속 조치 */}
                {meetingFollowUps.length > 0 && (
                  <div style={{ marginBottom: "32px" }}>
                    <h3
                      style={{
                        fontSize: "20px",
                        fontWeight: "600",
                        marginBottom: "16px",
                        color: "#374151",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      ✅ 후속 조치 사항
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      {meetingFollowUps.map((followUp, index) => (
                        <div
                          key={index}
                          style={{
                            padding: "16px",
                            backgroundColor: "#fff7ed",
                            border: "2px solid #fed7aa",
                            borderRadius: "10px",
                            fontSize: "14px",
                            color: "#9a3412",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "12px",
                          }}
                        >
                          <span
                            style={{
                              backgroundColor: "#ea580c",
                              color: "white",
                              borderRadius: "50%",
                              width: "24px",
                              height: "24px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: "700",
                              flexShrink: 0,
                            }}
                          >
                            {index + 1}
                          </span>
                          <span style={{ lineHeight: "1.5" }}>{followUp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* 회의 진행 중: 이용 불가 안내 */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "400px",
                  textAlign: "center",
                  padding: "40px",
                }}
              >
                <div
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "50%",
                    backgroundColor: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "24px",
                    border: "3px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      fontSize: "48px",
                      opacity: 0.6,
                    }}
                  >
                    📋
                  </div>
                </div>

                <h3
                  style={{
                    fontSize: "24px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "24px",
                    margin: 0,
                  }}
                >
                  회의 요약은 회의 완료 후 확인 가능해요
                </h3>

                <p
                  style={{
                    fontSize: "16px",
                    color: "#6b7280",
                    lineHeight: "1.6",
                    maxWidth: "400px",
                    margin: "24px 0",
                  }}
                >
                  현재 회의가 진행 중입니다. 회의가 완료되면 AI가 생성한 상세한
                  요약과 후속 조치 사항을 이곳에서 확인할 수 있습니다.
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 20px",
                    backgroundColor: "#fef3c7",
                    border: "1px solid #fbbf24",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#92400e",
                    fontWeight: "500",
                  }}
                >
                  <span>💡</span>
                  <span>
                    회의 중에는 "대화 기록" 탭에서 실시간 내용을 확인해보세요
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 대화 기록 탭: 실시간 대화 - 회의 상태와 무관하게 유지 */}
        {selectedTab === "conversation" && (
          <>
            {/* 참가자 관리 - 회의 진행 중에만 표시 */}
            {!isMeetingCompleted && (
              <div className={sectionContainer}>
                <ParticipantManager
                  participants={participants}
                  onParticipantsChange={setParticipants}
                />
              </div>
            )}

            {/* 실시간 전사 영역 - 항상 표시하되 회의 완료 후에는 읽기 전용 */}
            <div className={sectionContainer}>
              <h3 className={sectionTitle}>
                {isMeetingCompleted ? "회의 전사 기록" : "실시간 회의 전사"}
              </h3>
              <TranscriptionArea
                title={title}
                isRecording={!isMeetingCompleted && isRecording} // 회의 완료 후에는 녹음 비활성화
                isPaused={isPaused}
                participants={participants}
                logs={logs} // props로 logs 전달
                onTranscriptUpdate={setTranscript}
                onRecordingStart={handleRecordingStart}
                onRealTimeSummaryUpdate={handleRealTimeSummaryUpdate}
                onLogsUpdate={handleLogsUpdate}
              />
            </div>

            {/* 실시간 요약 영역 - 항상 표시 */}
            <ContentArea
              key="content-area-persistent" // 회의 상태와 무관하게 유지
              isRecording={!isMeetingCompleted && isRecording} // 회의 완료 후에는 녹음 비활성화
              isPaused={isPaused}
              recordingTime={recordingTime}
              contents={realTimeSummary}
            />

            {/* 녹음 컨트롤 - 회의 진행 중에만 표시 */}
            {!isMeetingCompleted && (
              <BottomControls
                isRecording={isRecording}
                isPaused={isPaused}
                onStartRecording={handleStartRecording}
                onPauseResume={handlePauseResume}
                onStop={handleStop}
              />
            )}
          </>
        )}
      </div>

      {/* 오른쪽 RAG 채팅 패널 */}
      <div
        className={isRightPanelOpen ? rightPanelExpanded : rightPanelCollapsed}
      >
        {isRightPanelOpen && (
          <div className={rightPanelContent}>
            <div style={{ marginBottom: "20px" }}>
              <h2 className={sectionTitle} style={{ fontSize: "18px" }}>
                히스토리 챗봇
              </h2>
              <RAGManager
                onVectorStoreReady={setVectorStoreId}
                selectedLabel={selectedLabel}
                onSelectedLabelChange={setSelectedLabel}
              />
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              <RAGChat
                vectorStoreId={vectorStoreId}
                isEnabled={!!vectorStoreId}
              />
            </div>
          </div>
        )}
      </div>

      {/* 회의 종료 모달 */}
      <MeetingEndModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        onMeetingComplete={handleMeetingComplete}
        meetingTitle={title}
        participants={participants}
        transcript={transcript}
        logs={logs}
        audioBlob={audioBlob || undefined}
        selectedLabel={selectedLabel}
        recordingStartTime={recordingStartTime}
        realTimeSummary={realTimeSummary}
      />

      {/* 토스트 메시지 */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default MeetingRecorder;
