"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  Tag,
  RefreshCw,
  MessageSquare,
  ChevronDown,
  CheckCircle,
} from "lucide-react";
import { sprinkles } from "../../styles/sprinkles.css";
import { API_BASE_URL } from "../../constants/KEY";

interface RAGLabel {
  id: string;
  name: string;
  pageCount: number;
  lastUpdated: string;
  isActive: boolean;
}

interface RAGManagerProps {
  onVectorStoreReady: (vectorStoreId: string) => void;
  selectedLabel: string;
  onSelectedLabelChange: (label: string) => void;
}

const RAGManager: React.FC<RAGManagerProps> = ({
  onVectorStoreReady,
  selectedLabel,
  onSelectedLabelChange,
}) => {
  const [availableLabels, setAvailableLabels] = useState<RAGLabel[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [vectorStoreStatus, setVectorStoreStatus] = useState<{
    id: string;
    status: string;
    pageCount: number;
  } | null>(null);
  const [vectorStoreId, setVectorStoreId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 사용 가능한 라벨 목록 로드
  useEffect(() => {
    loadAvailableLabels();
  }, []);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-dropdown="label-selector"]')) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isDropdownOpen]);

  const loadAvailableLabels = async () => {
    try {
      // 임시 테스트용 라벨 데이터
      const mockLabels: RAGLabel[] = [
        {
          id: "1",
          name: "UMEET주간회의",
          pageCount: 15,
          lastUpdated: "2024-01-15",
          isActive: true,
        },
        {
          id: "2",
          name: "기본기강화",
          pageCount: 23,
          lastUpdated: "2024-01-14",
          isActive: true,
        },
      ];

      // 실제 API 호출 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 500));
      setAvailableLabels(mockLabels);

      // 실제 API 호출 (주석 처리)
      // const response = await fetch("/api/rag/labels");
      // if (response.ok) {
      //   const labels = await response.json();
      //   setAvailableLabels(labels);
      // }
    } catch (error) {
      console.error("라벨 목록 로드 실패:", error);
    }
  };

  const processRAGData = async (labelName: string) => {
    setIsProcessing(true);
    try {
      // 테스트용 시뮬레이션 - 2초 대기
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // // 임시 페이지 데이터
      // const mockPages = [
      //   { id: "page1", title: `${labelName} - 문서 1` },
      //   { id: "page2", title: `${labelName} - 문서 2` },
      //   { id: "page3", title: `${labelName} - 문서 3` },
      // ];
      //
      // // Vector Store 상태 설정
      // const mockVectorStoreId = `vector-store-${labelName}-${Date.now()}`;
      // setVectorStoreStatus({
      //   id: mockVectorStoreId,
      //   status: "ready",
      //   pageCount: mockPages.length,
      // });
      //
      // // 부모 컴포넌트에 Vector Store ID 전달
      // onVectorStoreReady(mockVectorStoreId);

      // 실제 API 호출 코드 (주석 처리)
      const searchResponse = await fetch(`/api/rag/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: labelName,
        }),
      });
      // JSON 본문 꺼내기
      const data = await searchResponse.json();

      // ✅ vs_id 안전하게 파싱 (문자/객체 겸용)
      const res: string | undefined = data;

      console.log("res:", res);

      // ✅ state에 저장 + 상위 콜백 알림
      // setVectorStoreId(res);
      // onVectorStoreReady(res);
      setVectorStoreId("1");
      onVectorStoreReady("1");
    } catch (error) {
      console.error("RAG 데이터 처리 실패:", error);
      alert("RAG 데이터 처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLabelSelect = (labelName: string) => {
    onSelectedLabelChange(labelName);
    setIsDropdownOpen(false);
  };

  const selectedLabelData = availableLabels.find(
    (label) => label.name === selectedLabel
  );

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #ffffff, #f8fafc)",
        border: "2px solid #e2e8f0",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "20px",
        boxShadow:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #6e5dce, #b2b6ef)",
            borderRadius: "50%",
            padding: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Database size={20} style={{ color: "white" }} />
        </div>
        <h3
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: "700",
            color: "#1e293b",
          }}
        >
          참고할 회의록 가져오기
        </h3>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: "600",
            marginBottom: "12px",
            color: "#374151",
          }}
        >
          <Tag size={14} style={{ color: "#6e5dce" }} />
          연동할 라벨 선택
        </label>

        {/* 커스텀 드롭다운 */}
        <div
          style={{ position: "relative", width: "100%" }}
          data-dropdown="label-selector"
        >
          <button
            onClick={() => !isProcessing && setIsDropdownOpen(!isDropdownOpen)}
            disabled={isProcessing}
            style={{
              width: "100%",
              padding: "16px",
              border: `2px solid ${selectedLabel ? "#6e5dce" : "#e2e8f0"}`,
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "500",
              backgroundColor: isProcessing ? "#f1f5f9" : "white",
              cursor: isProcessing ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "all 0.3s ease",
              boxShadow: selectedLabel
                ? "0 2px 8px rgba(110, 93, 206, 0.2)"
                : "0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {selectedLabel ? (
                <>
                  <CheckCircle size={18} style={{ color: "#6e5dce" }} />
                  <div>
                    <div style={{ color: "#1e293b", fontWeight: "600" }}>
                      {selectedLabel}
                    </div>
                    {selectedLabelData && (
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        📄 {selectedLabelData.pageCount}개 페이지
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Tag size={18} style={{ color: "#9ca3af" }} />
                  <span style={{ color: "#9ca3af" }}>라벨을 선택하세요</span>
                </>
              )}
            </div>
            <ChevronDown
              size={18}
              style={{
                color: "#6b7280",
                transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.3s ease",
              }}
            />
          </button>

          {/* 드롭다운 메뉴 */}
          {isDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                backgroundColor: "white",
                border: "2px solid #e2e8f0",
                borderRadius: "12px",
                marginTop: "8px",
                boxShadow:
                  "0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                zIndex: 1000,
                overflow: "hidden",
              }}
            >
              {availableLabels.length > 0 ? (
                availableLabels.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => handleLabelSelect(label.name)}
                    style={{
                      width: "100%",
                      padding: "16px",
                      border: "none",
                      backgroundColor:
                        selectedLabel === label.name
                          ? "#f0f9ff"
                          : "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                      transition: "all 0.2s ease",
                      textAlign: "left",
                    }}
                    onMouseOver={(e) => {
                      if (selectedLabel !== label.name) {
                        e.currentTarget.style.backgroundColor = "#f8fafc";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedLabel !== label.name) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: label.isActive ? "#10b981" : "#f59e0b",
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "600", marginBottom: "2px" }}>
                        {label.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        📄 {label.pageCount}개 페이지 • 업데이트:{" "}
                        {label.lastUpdated}
                      </div>
                    </div>
                    {selectedLabel === label.name && (
                      <CheckCircle size={16} style={{ color: "#6e5dce" }} />
                    )}
                  </button>
                ))
              ) : (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#9ca3af",
                    fontSize: "14px",
                  }}
                >
                  사용 가능한 라벨이 없습니다
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedLabel && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px",
              backgroundColor: "#f0f8ff",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          >
            <Tag size={16} style={{ color: "#9292e7" }} />
            <span>
              선택된 라벨: <strong>{selectedLabel}</strong>
            </span>
            <button
              onClick={() => processRAGData(selectedLabel)}
              disabled={isProcessing}
              className={sprinkles({
                color: "on_primary",
                padding: 8,
                borderRadius: "small",
              })}
              style={{
                backgroundColor: "#6e5dce",
                border: "none",
                cursor: isProcessing ? "not-allowed" : "pointer",
                fontSize: "12px",
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {isProcessing ? (
                <>
                  <RefreshCw
                    size={12}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  처리 중...
                </>
              ) : (
                <>
                  <Database size={12} />
                  RAG 연동
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {vectorStoreStatus && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#e8f5e8",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <MessageSquare size={16} style={{ color: "#ee96c9" }} />
          <div style={{ fontSize: "14px" }}>
            <div style={{ fontWeight: "500", color: "#ee96c9" }}>
              RAG 연동 완료!
            </div>
            <div style={{ color: "#666", fontSize: "12px" }}>
              {vectorStoreStatus.pageCount}개 페이지가 Vector Store에
              저장되었습니다.
            </div>
          </div>
        </div>
      )}

      {/* CSS for animation */}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default RAGManager;
