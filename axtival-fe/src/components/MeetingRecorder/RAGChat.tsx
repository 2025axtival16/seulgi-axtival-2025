"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, ExternalLink } from "lucide-react";
import { sprinkles, semanticColors } from "../../styles/sprinkles.css";
import { API_BASE_URL } from "../../constants/KEY";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  // sources?: Array<{
  //   title: string;
  //   url: string;
  //   pageId: string;
  // }>;
}

interface RAGChatProps {
  vectorStoreId: string | null;
  isEnabled: boolean;
}

const RAGChat: React.FC<RAGChatProps> = ({ vectorStoreId, isEnabled }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 환영 메시지
  useEffect(() => {
    if (isEnabled && vectorStoreId && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "안녕하세요! RAG 연동이 완료되었습니다. 연동된 Confluence 페이지들에 대해 질문해보세요.",
          timestamp: new Date(),
        },
      ]);
    }
  }, [isEnabled, vectorStoreId]);

  const sendMessage = async () => {
    if (!inputValue.trim() || !vectorStoreId || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // 테스트용 시뮬레이션 - 1초 대기
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // // 임시 응답 생성
      // const mockResponses = [
      //   {
      //     answer: `"${userMessage.content}"에 대한 정보를 찾았습니다. 연동된 문서에서 관련 내용을 참조하여 답변드립니다.`,
      //     sources: [
      //       {
      //         title: "회의록 - 2024년 1월 기획회의",
      //         url: "https://lgucorp.atlassian.net/wiki/spaces/MadangWorkAgent/pages/123456",
      //         pageId: "123456",
      //       },
      //       {
      //         title: "개발 가이드 - API 문서",
      //         url: "https://lgucorp.atlassian.net/wiki/spaces/MadangWorkAgent/pages/123457",
      //         pageId: "123457",
      //       },
      //     ],
      //   },
      //   {
      //     answer: `질문해주신 "${userMessage.content}"에 대해 답변드리겠습니다. 프로젝트 문서를 기반으로 한 정보입니다.`,
      //     sources: [
      //       {
      //         title: "프로젝트 명세서",
      //         url: "https://lgucorp.atlassian.net/wiki/spaces/MadangWorkAgent/pages/123458",
      //         pageId: "123458",
      //       },
      //     ],
      //   },
      //   {
      //     answer: `"${userMessage.content}"에 관련된 내용을 문서에서 찾아 정리해드렸습니다. 추가 질문이 있으시면 언제든 말씀해주세요.`,
      //     sources: [],
      //   },
      // ];
      //
      // // 랜덤 응답 선택
      // const randomResponse =
      //   mockResponses[Math.floor(Math.random() * mockResponses.length)];
      console.log(userMessage.content);
      console.log(vectorStoreId);
      console.log(messages.slice(-5));

      const payload = {
        question: userMessage?.content ?? "",
        vectorStoreId: vectorStoreId ?? "",
      };
      console.log("POST /api/rag/chat payload ->", payload);

      const res = await fetch(`${API_BASE_URL}/api/rag/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log(data);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.answer,
        timestamp: new Date(),
        //sources: data.sources,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("채팅 오류:", error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          "죄송합니다. 응답 생성 중 오류가 발생했습니다. 다시 시도해주세요.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isEnabled) {
    return (
      <div
        className={sprinkles({
          backgroundColor: "neutral_1",
          borderRadius: "medium",
          padding: 40,
          color: "neutral_1",
        })}
        style={{
          border: "1px dashed #ccc",
          textAlign: "center",
        }}
      >
        <Bot
          size={48}
          className={sprinkles({ margin: 16 })}
          style={{ opacity: 0.5 }}
        />
        <p>RAG 연동을 먼저 설정해주세요.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* 채팅 영역 - 항상 표시 */}
      <div
        className={sprinkles({
          backgroundColor: "neutral",
          borderColor: "neutral_2",
          borderRadius: "medium",
          borderWidth: "small",
        })}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* 채팅 메시지 영역 */}
        <div
          className={sprinkles({
            padding: 16,
          })}
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
              }}
            >
              {message.role !== "user" && (
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: "#ee96c9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Bot size={16} style={{ color: "white" }} />
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems:
                    message.role === "user" ? "flex-end" : "flex-start",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "12px",
                    backgroundColor:
                      message.role === "user" ? "#d8dff6" : "#fbdaed",
                    fontSize: "14px",
                    lineHeight: "1.5",
                    whiteSpace: "pre-wrap",
                    display: "inline-block",
                    maxWidth: "100%",
                    width: "fit-content",
                  }}
                >
                  {message.content}
                </div>

                {/* 출처 링크 */}
                {message.sources && message.sources.length > 0 && (
                  <div
                    style={{
                      marginTop: "8px",
                      textAlign: message.role === "user" ? "right" : "left",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        marginBottom: "4px",
                      }}
                    >
                      참고 문서:
                    </div>
                    {message.sources.map((source, index) => (
                      <div key={index} style={{ marginBottom: "4px" }}>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "12px",
                            color: "#9292e7",
                            textDecoration: "none",
                          }}
                        >
                          <ExternalLink size={12} />
                          {source.title}
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    fontSize: "12px",
                    color: "#999",
                    marginTop: "4px",
                    textAlign: message.role === "user" ? "right" : "left",
                  }}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              {message.role === "user" && (
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: "#9292e7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Bot size={16} style={{ color: "white" }} />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "#ee96c9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bot size={16} style={{ color: "white" }} />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "12px",
                    backgroundColor: "#ee96c9",
                    fontSize: "14px",
                    color: "#fefbfd",
                    display: "inline-block",
                    maxWidth: "100%",
                    width: "fit-content",
                  }}
                >
                  답변을 생성하고 있습니다...
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div
          className={sprinkles({
            borderColor: "neutral_2",
            padding: 16,
          })}
          style={{
            borderTopWidth: "1px",
            borderTopStyle: "solid",
            display: "flex",
            gap: "8px",
          }}
        >
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="질문을 입력하세요..."
            disabled={isLoading}
            className={sprinkles({
              borderRadius: "small",
              padding: 12,
              fontSize: "small",
            })}
            style={{
              flex: 1,
              border: "1px solid #ccc",
              resize: "none",
              height: "40px",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className={sprinkles({
              backgroundColor: "primary",
              color: "on_primary",
              padding: 8,
              borderRadius: "small",
            })}
            style={{
              border: "none",
              cursor:
                !inputValue.trim() || isLoading ? "not-allowed" : "pointer",
              opacity: !inputValue.trim() || isLoading ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RAGChat;
