"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Mic, MicOff, Volume2, AlertCircle } from "lucide-react";
import { sprinkles } from "../../styles/sprinkles.css";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import { formatTimeFromDate } from "../../utils/timeFormat";
import { SPEECH_KEY, SPEECH_REGION, API_BASE_URL } from "../../constants/KEY";

interface TranscriptItem {
  id: string;
  speaker: string;
  content: string;
  timestamp: Date;
  isPartial?: boolean;
}

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface TranscriptionAreaProps {
  title?: string;
  isRecording: boolean;
  isPaused: boolean;
  participants: Employee[];
  onTranscriptUpdate: (transcript: TranscriptItem[]) => void;
  onRecordingStart: (startTime: Date) => void;
  onRealTimeSummaryUpdate: (summary: string) => void;
  onLogsUpdate: (logs: string[]) => void;
}

const TranscriptionArea: React.FC<TranscriptionAreaProps> = ({
  title,
  isRecording,
  isPaused,
  participants,
  onTranscriptUpdate,
  onRecordingStart,
  onRealTimeSummaryUpdate,
  onLogsUpdate,
}) => {
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<string>("");
  const [error, setError] = useState<string>("");

  // 참조
  const transcriberRef = useRef<SpeechSDK.ConversationTranscriber | null>(null);
  const speechConfigRef = useRef<SpeechSDK.SpeechConfig>();
  const speakers = useRef<Record<string, string>>({});
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const logsRef = useRef<string[]>([]);
  const isPausedRef = useRef<boolean>(isPaused);
  const logCountRef = useRef<number>(0);

  // 참가자 라벨 매핑
  const { participantsList, labelMap } = useMemo(() => {
    const list = participants.map((p) => p.name);
    const map: Record<string, string> = {};
    list.forEach((name, idx) => {
      map[String.fromCharCode(65 + idx)] = name;
    });
    return { participantsList: list, labelMap: map };
  }, [participants]);

  // isPaused ref 업데이트 및 화자 상태 클리어
  useEffect(() => {
    isPausedRef.current = isPaused;
    if (isPaused) {
      setCurrentSpeaker(""); // 일시정지 시 현재 화자 클리어
    }
  }, [isPaused]);

  // Speech Config 초기화
  useEffect(() => {
    const initializeSpeechConfig = () => {
      try {
        const config = SpeechSDK.SpeechConfig.fromSubscription(
          SPEECH_KEY,
          SPEECH_REGION
        );
        config.speechRecognitionLanguage = "ko-KR";
        speechConfigRef.current = config;
        setError("");
      } catch (err) {
        console.error("Speech SDK 초기화 실패:", err);
        setError("Speech SDK 초기화 실패 - SPEECH_KEY를 확인하세요");
      }
    };

    initializeSpeechConfig();
  }, []);

  // 요약 API 호출 함수
  const callSummaryAPI = async (logs: string[]) => {
    try {
      // 시스템 메시지가 아닌 실제 대화 내용만 추출
      const conversationLogs = logs.filter(
        (log) =>
          !log.includes("🎤") &&
          !log.includes("🛑") &&
          !log.includes("⏸️") &&
          !log.includes("▶️") &&
          !log.includes("❌")
      );

      if (conversationLogs.length === 0) return;

      const response = await fetch(`${API_BASE_URL}/summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title,
          text: logs.join("\n"),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📊 API 응답 데이터:", data);

      if (data.answer) {
        console.log("✅ 요약 받음:", data.answer);
        onRealTimeSummaryUpdate(data.answer);
      } else {
        console.log("❌ 요약 데이터가 없음, 응답 구조:", Object.keys(data));
      }
    } catch (error) {
      console.error("💥 요약 API 호출 실패:", error);
    }
  };

  // 로그 추가 함수
  const appendLog = (line: string) => {
    const next = [...logsRef.current, line];
    logsRef.current = next;
    setLogs(next);
    onLogsUpdate(next); // 상위 컴포넌트에 로그 업데이트 전달
    console.log("next", next);

    // 로그 카운터 증가 (시스템 메시지가 아닌 경우만)
    const isSystemMessage =
      line.includes("🎤") ||
      line.includes("🛑") ||
      line.includes("⏸️") ||
      line.includes("▶️") ||
      line.includes("❌");

    if (!isSystemMessage) {
      logCountRef.current += 1;
      console.log("💬 현재 로그 카운트:", logCountRef.current);

      // 5개마다 요약 API 호출 (테스트를 위해 낮춤)
      if (logCountRef.current >= 5) {
        console.log("🔥 5개 로그 누적! 요약 API 호출합니다.");
        callSummaryAPI(logsRef.current);
        logCountRef.current = 0; // 카운터 리셋
      }
    }

    // TranscriptItem으로 변환하여 상위 컴포넌트에 전달
    const transcriptItems = next
      .map((log, index) => {
        const timeMatch = log.match(/^\[(\d{2}:\d{2}:\d{2})\]/);
        const speakerMatch = log.match(/\[([^\]]+)\]/g);
        const speaker =
          speakerMatch && speakerMatch.length > 1
            ? speakerMatch[1].replace(/[\[\]]/g, "")
            : "Unknown Speaker";
        const content = log.replace(/^\[.*?\]\[.*?\]\s/, "");

        return {
          id: `${Date.now()}-${index}`,
          speaker,
          content,
          timestamp: new Date(),
          isPartial: false,
        };
      })
      .filter((item) => item.content); // 빈 내용 제외

    setTranscript(transcriptItems);
    onTranscriptUpdate(transcriptItems);
  };

  // ConversationTranscriber 생성
  const createTranscriber = (): SpeechSDK.ConversationTranscriber | null => {
    onLogsUpdate([]);
    const speechConfig = speechConfigRef.current;
    if (!speechConfig) {
      console.error("Speech config not initialized");
      return null;
    }

    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const transcriber = new SpeechSDK.ConversationTranscriber(
      speechConfig,
      audioConfig
    );

    transcriber.transcribed = (_s: any, evt: any) => {
      // 일시정지 상태에서는 전사 결과를 무시
      if (isPausedRef.current) {
        return;
      }

      const result = evt.result;
      const time = formatTimeFromDate(new Date());
      if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
        const id = result.speakerId!;
        if (!speakers.current[id]) {
          speakers.current[id] = String.fromCharCode(
            65 + Object.keys(speakers.current).length
          );
        }
        const label = speakers.current[id];
        const name = `화자 ${label}`;
        appendLog(`[${time}][${name}] ${result.text}`);
        setCurrentSpeaker(name);
      }
    };

    // 자동 재시작 핸들러
    const restartHandler = async (_s: any, evt: any) => {
      console.warn("🚨 Speech SDK 이벤트 발생:", evt);
      appendLog("⏸️ 음성 인식이 중단되었습니다. 자동 재시작 준비 중...");

      try {
        if (transcriberRef.current) {
          // 이벤트 핸들러 정리
          transcriberRef.current.transcribed = () => {}; // 빈 함수로 이벤트 무시
          transcriberRef.current.canceled = () => {}; // 빈 함수로 이벤트 무시
          await transcriberRef.current.stopTranscribingAsync();
          transcriberRef.current = null;
        }

        // Speech Config 재생성
        const config = SpeechSDK.SpeechConfig.fromSubscription(
          SPEECH_KEY,
          SPEECH_REGION
        );
        config.speechRecognitionLanguage = "ko-KR";
        speechConfigRef.current = config;

        // 새로운 transcriber 생성 및 시작
        const newTranscriber = createTranscriber();
        if (newTranscriber) {
          transcriberRef.current = newTranscriber;
          await newTranscriber.startTranscribingAsync();
          setIsListening(true);
          appendLog("▶️ 자동 재시작 완료");
        }
      } catch (e) {
        console.error("자동 재시작 실패:", e);
        appendLog("❌ 자동 재시작 중 오류 발생");
        setIsListening(false);
      }
    };

    transcriber.canceled = restartHandler;

    return transcriber;
  };

  // 녹음 시작/중지 제어
  useEffect(() => {
    const startTranscribing = async () => {
      if (!speechConfigRef.current) {
        setError("Speech config가 초기화되지 않았습니다");
        return;
      }

      try {
        const transcriber = createTranscriber();
        if (!transcriber) return;

        transcriberRef.current = transcriber;

        // 🔄 RESTART 시에만 상태 초기화 (Stop은 로그 유지)
        const hasExistingLogs = logsRef.current.length > 0;
        if (hasExistingLogs) {
          console.log("🔄 재시작: 이전 로그 정리 중...");
          appendLog("🔄 새로운 녹음 세션 시작 - 이전 로그 정리");
        }

        logsRef.current = [];
        setLogs([]);
        setTranscript([]);
        logCountRef.current = 0; // 로그 카운터 리셋

        await transcriber.startTranscribingAsync();
        setIsListening(true);
        appendLog("🎤 실시간 전사 시작");
        setError("");
        onRecordingStart(new Date());
        console.log("🚀 녹음 시작 (restart 정리 완료):", new Date());
      } catch (err) {
        console.error("전사 시작 실패:", err);
        setError("음성 인식 시작 실패");
        setIsListening(false);
      }
    };

    const stopTranscribing = async () => {
      if (transcriberRef.current) {
        try {
          // 이벤트 핸들러 정리
          transcriberRef.current.transcribed = () => {}; // 빈 함수로 이벤트 무시
          transcriberRef.current.canceled = () => {}; // 빈 함수로 이벤트 무시
          await transcriberRef.current.stopTranscribingAsync();
          transcriberRef.current = null;
          setIsListening(false);
          appendLog("🛑 실시간 전사 종료 (로그 유지)");
        } catch (err) {
          console.error("전사 종료 실패:", err);
        }
      }
    };

    if (isRecording && !isListening && !transcriberRef.current) {
      // 중복 실행 방지: transcriber가 이미 존재하면 시작하지 않음
      startTranscribing();
    } else if (!isRecording && isListening) {
      stopTranscribing();
    }

    return () => {
      if (transcriberRef.current) {
        // 이벤트 핸들러 정리
        transcriberRef.current.transcribed = () => {}; // 빈 함수로 이벤트 무시
        transcriberRef.current.canceled = () => {}; // 빈 함수로 이벤트 무시
        transcriberRef.current.stopTranscribingAsync();
        transcriberRef.current = null;
      }
    };
  }, [isRecording, labelMap]); // labelMap 의존성 추가

  // 자동 스크롤
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div
      className={sprinkles({
        backgroundColor: "neutral_1",
        borderRadius: "medium",
        padding: 16,
        borderColor: "neutral_2",
        borderWidth: "small",
      })}
      style={{
        maxHeight: "400px",
        overflowY: "auto",
      }}
    >
      {/* 상태 표시 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
          paddingBottom: "8px",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isListening && !isPaused ? (
            <Mic size={16} style={{ color: "#4CAF50" }} />
          ) : (
            <MicOff size={16} style={{ color: "#999" }} />
          )}
          <span
            className={sprinkles({
              fontSize: "small",
              color: "neutral_6",
            })}
          >
            {isListening && !isPaused
              ? "실시간 녹음 중..."
              : isListening && isPaused
              ? "녹음 일시정지"
              : "녹음 대기"}
          </span>
        </div>

        {currentSpeaker && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Volume2 size={16} style={{ color: "#2196F3" }} />
            <span
              className={sprinkles({
                fontSize: "small",
                color: "primary",
              })}
            >
              {currentSpeaker}
            </span>
          </div>
        )}
      </div>

      {/* 에러 표시 */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px",
            backgroundColor: "#ffeaa7",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          <AlertCircle size={16} style={{ color: "#d63031" }} />
          <span style={{ fontSize: "14px", color: "#2d3436" }}>{error}</span>
        </div>
      )}

      {/* 전사 내용 */}
      <div style={{ minHeight: "200px" }}>
        {logs.length === 0 ? (
          <div
            className={sprinkles({
              color: "neutral_4",
              padding: 40,
              fontSize: "small",
            })}
            style={{
              textAlign: "center",
            }}
          >
            {error
              ? "설정을 확인한 후 다시 시도하세요."
              : "회의 내용이 여기에 실시간으로 표시됩니다."}
          </div>
        ) : (
          <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
            {logs.map((log, index) => {
              // 로그 파싱
              const timeMatch = log.match(/^\[(\d{2}:\d{2}:\d{2})\]/);
              const speakerMatch = log.match(/\]\[([^\]]+)\]/);
              const content = log.replace(/^\[.*?\]\[.*?\]\s*/, "");

              if (!content) return null;

              const time = timeMatch ? timeMatch[1] : "";
              const speaker = speakerMatch ? speakerMatch[1] : "System";
              const isSystemMessage =
                log.includes("🎤") ||
                log.includes("🛑") ||
                log.includes("⏸️") ||
                log.includes("▶️") ||
                log.includes("❌");

              return (
                <div
                  key={index}
                  style={{
                    marginBottom: "12px",
                    padding: isSystemMessage ? "8px 12px" : "12px",
                    backgroundColor: isSystemMessage ? "#f8f9fa" : "#ffffff",
                    borderRadius: "8px",
                    borderLeft: isSystemMessage
                      ? "3px solid #6c757d"
                      : "3px solid #e6007e",
                  }}
                >
                  {isSystemMessage ? (
                    <div style={{ color: "#6c757d", fontStyle: "italic" }}>
                      {content}
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: "4px",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            backgroundColor: "#e6007e",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                        >
                          {speaker.charAt(0)}
                        </div>
                        <span style={{ fontWeight: "500", fontSize: "14px" }}>
                          {speaker}
                        </span>
                        <span style={{ fontSize: "12px", color: "#666" }}>
                          {time}
                        </span>
                      </div>
                      <div style={{ paddingLeft: "32px", color: "#2d3436" }}>
                        {content}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div ref={transcriptEndRef} />
      </div>
    </div>
  );
};

export default TranscriptionArea;
