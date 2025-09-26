"use client";

import React, { useState, useEffect } from "react";
import { CommentData } from "../../constants/types";
import { apiGet } from "../../utils/api";
import { ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css"; // 하이라이트 스타일
import {
  leftPanel,
  leftPanelTitle,
  leftPanelContent,
  commentCard,
  loadingState,
  errorState,
} from "../../styles/meetingRecorder.css";

interface LeftPannelProps {
  labelName?: string; // API 호출에 사용할 라벨명
}

const LeftPannel: React.FC<LeftPannelProps> = ({ labelName = "" }) => {
  const [commentData, setCommentData] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // API 호출 함수
  const fetchComments = async () => {
    // 라벨이 선택되지 않은 경우 처리
    if (!labelName || labelName.trim() === "") {
      setError("라벨을 선택해주세요");
      setCommentData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiGet(`/api/comments/${labelName}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CommentData[] = await response.json();
      setCommentData(data);
      // 초기에 모든 카드를 펼쳐진 상태로 설정
      const initialExpanded = new Set(data.map((item) => item.page_id));
      setExpandedCards(initialExpanded);
      console.log(data);
    } catch (err) {
      console.error("댓글 데이터 로딩 실패:", err);
      setError("라벨을 선택해주세요");
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchComments();
  }, [labelName]);

  // 새로고침 버튼 핸들러
  const handleRefresh = () => {
    fetchComments();
  };

  // URL 클릭 핸들러
  const handleUrlClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // 카드 토글 핸들러
  const handleToggleCard = (pageId: string) => {
    const newExpandedCards = new Set(expandedCards);
    if (expandedCards.has(pageId)) {
      newExpandedCards.delete(pageId);
    } else {
      newExpandedCards.add(pageId);
    }
    setExpandedCards(newExpandedCards);
  };

  // 전체 접기/펼치기 핸들러
  const handleToggleAll = () => {
    if (expandedCards.size === commentData.length) {
      // 모두 펼쳐져 있으면 모두 접기
      setExpandedCards(new Set());
    } else {
      // 일부 또는 모두 접혀있으면 모두 펼치기
      const allExpanded = new Set(commentData.map((item) => item.page_id));
      setExpandedCards(allExpanded);
    }
  };

  return (
    <div className={leftPanel}>
      <div className={leftPanelTitle}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
            📋 히스토리 요약
          </h2>
          {labelName && (
            <span
              style={{
                backgroundColor: "#e0f2fe",
                color: "#0369a1",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: "500",
              }}
            >
              {labelName}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {/* 전체 토글 버튼 */}
          {commentData.length > 0 && (
            <button
              onClick={handleToggleAll}
              style={{
                background: "#6e5dce",
                border: "none",
                borderRadius: "6px",
                padding: "6px 10px",
                color: "white",
                fontSize: "11px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 2px 4px rgba(139, 92, 246, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
              title={
                expandedCards.size === commentData.length
                  ? "모두 접기"
                  : "모두 펼치기"
              }
            >
              {expandedCards.size === commentData.length ? (
                <>
                  <ChevronUp size={14} />
                </>
              ) : (
                <>
                  <ChevronDown size={14} />
                </>
              )}
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading}
            style={{
              background: "#b2b6ef",
              border: "0px solid #ddd",
              borderRadius: "4px",
              padding: "4px 8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "12px",
              color: "#413a75",
            }}
          >
            {loading ? "로딩..." : "새로고침"}
          </button>
        </div>
      </div>

      <div className={leftPanelContent}>
        {loading && (
          <div className={loadingState}>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "24px",
                  marginBottom: "12px",
                  animation: "spin 1s linear infinite",
                  display: "inline-block",
                }}
              >
                ⚙️
              </div>
              <p style={{ margin: 0, color: "#6b7280" }}>
                댓글 데이터를 로드하는 중...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className={errorState}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
              <p style={{ margin: "0 0 16px 0", fontWeight: "500" }}>{error}</p>
              {labelName && (
                <button
                  onClick={handleRefresh}
                  style={{
                    background: "#e6007e",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    color: "white",
                    fontSize: "12px",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  🔄 다시 시도
                </button>
              )}
            </div>
          </div>
        )}

        {!loading && !error && commentData.length === 0 && labelName && (
          <div className={loadingState}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📝</div>
              <p style={{ margin: 0, color: "#6b7280" }}>
                표시할 댓글이 없습니다.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && commentData.length > 0 && (
          <div style={{ marginTop: "8px" }}>
            {commentData.map((item, index) => (
              <div
                key={item.page_id}
                className={commentCard}
                style={{
                  background: expandedCards.has(item.page_id)
                    ? "linear-gradient(135deg, #ffffff, #f8fafc)"
                    : "linear-gradient(135deg, #fafafa, #f1f5f9)",
                  border: `2px solid ${
                    expandedCards.has(item.page_id) ? "#e2e8f0" : "#e5e7eb"
                  }`,
                  borderRadius: "12px",
                  padding: "20px",
                  marginBottom: "16px",
                  boxShadow: expandedCards.has(item.page_id)
                    ? "0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
                    : "0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  position: "relative" as const,
                  overflow: "hidden",
                  transform: expandedCards.has(item.page_id)
                    ? "translateY(0)"
                    : "translateY(2px)",
                }}
              >
                {/* 토글 아이콘 버튼 */}
                <button
                  onClick={() => handleToggleCard(item.page_id)}
                  style={{
                    position: "absolute" as const,
                    top: "16px",
                    right: "16px",
                    backgroundColor: expandedCards.has(item.page_id)
                      ? "#6e5dce"
                      : "#b2b6ef",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
                    zIndex: 1,
                  }}
                  title={
                    expandedCards.has(item.page_id)
                      ? "댓글 접기"
                      : "댓글 펼치기"
                  }
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "scale(1.1)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0, 0, 0, 0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 6px rgba(0, 0, 0, 0.15)";
                  }}
                >
                  {expandedCards.has(item.page_id) ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </button>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "12px",
                    marginRight: "32px",
                  }}
                >
                  <h3
                    style={{
                      margin: "0",
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#1e293b",
                      lineHeight: "1.4",
                      flex: 1,
                    }}
                  >
                    📄 {item.title}
                  </h3>
                  {/* 댓글 개수 배지 */}
                  <span
                    style={{
                      backgroundColor: expandedCards.has(item.page_id)
                        ? "#e0f2fe"
                        : "#fef3c7",
                      color: expandedCards.has(item.page_id)
                        ? "#0369a1"
                        : "#d97706",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      fontSize: "11px",
                      fontWeight: "600",
                      minWidth: "20px",
                      textAlign: "center",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {item.comments.length}개
                  </span>
                </div>

                <button
                  onClick={() => handleUrlClick(item.url)}
                  title="페이지에서 열기"
                  style={{
                    background: "#6e5dce",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    color: "white",
                    fontSize: "12px",
                    fontWeight: "500",
                    cursor: "pointer",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s ease",
                  }}
                >
                  🔗 &nbsp; 페이지 보기
                </button>

                {/* 댓글 영역 - 토글 가능 */}
                <div
                  style={{
                    overflow: "hidden",
                    transition:
                      "max-height 0.4s ease-in-out, opacity 0.3s ease",
                    maxHeight: expandedCards.has(item.page_id) ? "300px" : "0",
                    opacity: expandedCards.has(item.page_id) ? 1 : 0,
                    width: "100%",
                    boxSizing: "border-box" as const,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column" as const,
                      gap: "8px",
                      maxHeight: "300px",
                      overflowY: "auto" as const,
                      overflowX: "hidden" as const,
                      paddingRight: "6px",
                      paddingTop: expandedCards.has(item.page_id) ? "0" : "0",
                      transform: expandedCards.has(item.page_id)
                        ? "translateY(0)"
                        : "translateY(-10px)",
                      transition: "transform 0.3s ease",
                      // 커스텀 스크롤바 스타일을 위한 클래스
                      scrollbarWidth: "thin" as const,
                      scrollbarColor: "#6e5dce #f1f5f9",
                    }}
                    className="custom-scrollbar"
                  >
                    {item.comments.map((comment, commentIndex) => (
                      <div
                        key={commentIndex}
                        style={{
                          backgroundColor: "#f1f5f9",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          padding: "12px",
                          fontSize: "14px",
                          lineHeight: "1.6",
                          color: "#334155",
                          whiteSpace: "pre-wrap" as const,
                          wordWrap: "break-word" as const,
                          wordBreak: "break-word" as const,
                          overflowWrap: "break-word" as const,
                          position: "relative" as const,
                          transform: expandedCards.has(item.page_id)
                            ? "scale(1)"
                            : "scale(0.95)",
                          transition: "transform 0.2s ease",
                          marginRight: "2px", // 스크롤바 공간 확보
                          maxWidth: "100%",
                          boxSizing: "border-box" as const,
                        }}
                      >
                        <div
                          style={{
                            position: "absolute" as const,
                            top: "8px",
                            right: "8px",
                            backgroundColor: "#64748b",
                            color: "white",
                            borderRadius: "4px",
                            padding: "2px 6px",
                            fontSize: "10px",
                            fontWeight: "500",
                          }}
                        >
                          #{commentIndex + 1}
                        </div>
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
                          {comment}
                        </ReactMarkdown>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 스핀링에 필요한 CSS 애니메이션 및 커스텀 스크롤바 */}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #6e5dce, #b2b6ef);
          border-radius: 10px;
          transition: background 0.3s ease;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #5b4fb8, #9fa3eb);
        }

        /* Firefox 스크롤바 */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #6e5dce #f1f5f9;
        }
      `}</style>
    </div>
  );
};

export default LeftPannel;
