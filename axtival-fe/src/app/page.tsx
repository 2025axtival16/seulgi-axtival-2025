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
import { formatTime } from "../utils/timeFormat";
import {
  initializeAudioRecording,
  setupMediaRecorderHandlers,
} from "../utils/audioRecording";
import { copyToClipboard, formatMeetingNotes } from "../utils/clipboard";
import { useCurrentDateTime } from "../utils/dateTime";
import Toast from "../components/Toast/Toast";
import { PanelRightClose, PanelRightOpen } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string;
  department?: string;
}

interface TranscriptItem {
  id: string;
  speaker: string;
  content: string;
  timestamp: Date;
}

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

  // 토스트 상태
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

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

    // 🔄 RESTART 시에만 상태 초기화 (Stop은 상태 유지)
    const hasExistingSummary = realTimeSummary.length > 0;
    if (hasExistingSummary) {
      console.log(
        "🔄 재시작: 이전 요약 정리 중...",
        realTimeSummary.length,
        "개"
      );
    }

    setIsRecording(true);
    setIsPaused(false);
    setRecordingTime(0);
    setTranscript([]);
    setLogs([]); // restart할 때 로그도 정리
    setRealTimeSummary([]); // restart할 때만 정리
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

      {/* 메인 회의 영역 */}
      <div className={mainContent}>
        <Header
          title={title}
          isEditingTitle={isEditingTitle}
          recordingTime={recordingTime}
          recordingStartTime={recordingStartTime}
          onTitleChange={handleTitleChange}
          onTitleEdit={handleTitleEdit}
          onTitleSave={handleTitleSave}
          onCopyNotes={handleCopyNotes}
        />

        {/* 참가자 관리 */}
        <div className={sectionContainer}>
          <ParticipantManager
            participants={participants}
            onParticipantsChange={setParticipants}
          />
        </div>

        {/* 실시간 전사 영역 */}

        <div className={sectionContainer}>
          <h3 className={sectionTitle}>실시간 회의 기록</h3>
          <TranscriptionArea
            title={title}
            isRecording={isRecording}
            isPaused={isPaused}
            participants={participants}
            onTranscriptUpdate={setTranscript}
            onRecordingStart={handleRecordingStart}
            onRealTimeSummaryUpdate={handleRealTimeSummaryUpdate}
            onLogsUpdate={handleLogsUpdate}
          />
        </div>

        <ContentArea
          key={`content-area-${realTimeSummary.length}`}
          isRecording={isRecording}
          isPaused={isPaused}
          recordingTime={recordingTime}
          contents={realTimeSummary}
        />

        <BottomControls
          isRecording={isRecording}
          isPaused={isPaused}
          onStartRecording={handleStartRecording}
          onPauseResume={handlePauseResume}
          onStop={handleStop}
        />
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
        meetingTitle={title}
        participants={participants}
        transcript={transcript}
        logs={logs}
        audioBlob={audioBlob || undefined}
        selectedLabel={selectedLabel}
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
