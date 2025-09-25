"use client";

import React, { useState, useEffect } from "react";
import { Database, Tag, RefreshCw, MessageSquare } from "lucide-react";
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

  // 사용 가능한 라벨 목록 로드
  useEffect(() => {
    loadAvailableLabels();
  }, []);

  const loadAvailableLabels = async () => {
    try {
      // 임시 테스트용 라벨 데이터
      const mockLabels: RAGLabel[] = [
        {
          id: "1",
          name: "AIWA주간회의",
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
      const searchResponse = await fetch(`${API_BASE_URL}/api/rag/upload`, {
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

  return (
    <div
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <Database size={20} style={{ color: "#e6007e" }} />
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>
          참고할 회의록 가져오기
        </h3>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            fontSize: "14px",
            fontWeight: "500",
            marginBottom: "8px",
          }}
        >
          연동할 라벨 선택
        </label>
        <select
          value={selectedLabel}
          onChange={(e) => {
            const newLabel = e.target.value;
            onSelectedLabelChange(newLabel);
          }}
          disabled={isProcessing}
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "14px",
            backgroundColor: isProcessing ? "#f5f5f5" : "white",
          }}
        >
          <option value="">라벨을 선택하세요</option>
          {availableLabels.map((label) => (
            <option key={label.id} value={label.name}>
              {label.name}
            </option>
          ))}
        </select>
      </div>

      {selectedLabel && (
        <div style={{ marginBottom: "16px" }}>
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
                backgroundColor: "primary",
                color: "on_primary",
                padding: 8,
                borderRadius: "small",
              })}
              style={{
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
