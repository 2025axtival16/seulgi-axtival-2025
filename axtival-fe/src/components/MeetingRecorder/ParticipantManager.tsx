"use client";

import React, { useState, useEffect } from "react";
import { Search, X, Plus, User } from "lucide-react";
import { sprinkles } from "../../styles/sprinkles.css";
import { API_BASE_URL } from "../../constants/KEY";

interface Employee {
  id: string;
  name: string;
  email: string;
  department?: string;
}

// Microsoft Graph API User 타입
interface GraphUser {
  businessPhones: string[];
  displayName: string;
  givenName: string;
  jobTitle: string | null;
  mail: string;
  mobilePhone: string;
  officeLocation: string | null;
  preferredLanguage: string | null;
  surname: string | null;
  userPrincipalName: string;
  id: string;
}

// Microsoft Graph API 응답 타입
interface GraphAPIResponse {
  "@odata.context": string;
  value: GraphUser[];
}

interface ParticipantManagerProps {
  participants: Employee[];
  onParticipantsChange: (participants: Employee[]) => void;
}

const ParticipantManager: React.FC<ParticipantManagerProps> = ({
  participants,
  onParticipantsChange,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Employee[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 직원 검색 API 호출
  const searchEmployees = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/userinfo/${encodeURIComponent(query.trim())}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const apiResponse: GraphAPIResponse = await response.json();

        // Microsoft Graph API response를 Employee 형태로 변환
        const employees: Employee[] = apiResponse.value.map(
          (user: GraphUser) => {
            // displayName에서 팀명 추출 ("남궁수 Consumer전략실행팀" → "Consumer전략실행팀")
            const displayNameParts = user.displayName.split(" ");
            const department =
              displayNameParts.length > 1
                ? displayNameParts.slice(1).join(" ")
                : undefined;

            return {
              id: user.id,
              name:
                user.givenName ||
                user.displayName.split(" ")[0] ||
                user.displayName,
              email: user.mail || user.userPrincipalName,
              department: department,
            };
          }
        );

        setSearchResults(employees);
      } else {
        console.error("API 응답 오류:", response.status, response.statusText);
        setSearchResults([]);
      }
    } catch (error) {
      console.error("직원 검색 중 오류:", error);
      alert("직원 검색 중 오류가 발생했습니다. 서버 연결을 확인해주세요.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 검색어 변경시 디바운스 적용
  useEffect(() => {
    const timer = setTimeout(() => {
      searchEmployees(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addParticipant = (employee: Employee) => {
    if (!participants.find((p) => p.id === employee.id)) {
      onParticipantsChange([...participants, employee]);
    }
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchOpen(false);
  };

  const removeParticipant = (employeeId: string) => {
    onParticipantsChange(participants.filter((p) => p.id !== employeeId));
  };

  return (
    <div>
      {/* 참가자 목록 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        {participants.map((participant) => (
          <div
            key={participant.id}
            className={sprinkles({
              backgroundColor: "neutral_2",
              fontSize: "small",
            })}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 12px",
              borderRadius: "20px",
              gap: "8px",
            }}
          >
            <div
              className={sprinkles({
                backgroundColor: "primary",
                color: "on_primary",
                borderRadius: "full",
                fontSize: "xsmall",
                fontWeight: "bold",
              })}
              style={{
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {participant.name.charAt(0)}
            </div>
            <span>{participant.name}</span>
            <button
              onClick={() => removeParticipant(participant.id)}
              className={sprinkles({
                padding: 2,
              })}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {/* 참가자 추가 버튼 */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className={sprinkles({
            fontSize: "small",
            color: "neutral_1",
          })}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px 12px",
            border: "1px dashed #ccc",
            backgroundColor: "transparent",
            borderRadius: "20px",
            cursor: "pointer",
            gap: "6px",
          }}
        >
          <Plus size={16} />
          대화 참석자 추가
        </button>
      </div>

      {/* 검색 창 */}
      {isSearchOpen && (
        <div
          className={sprinkles({
            backgroundColor: "neutral",
            borderRadius: "medium",
            padding: 16,
            borderColor: "neutral_2",
            borderWidth: "small",
          })}
          style={{
            position: "relative",
            marginBottom: "16px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <Search size={20} style={{ marginRight: "8px", color: "#666" }} />
            <input
              type="text"
              placeholder="이름 또는 이메일로 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={sprinkles({
                fontSize: "medium",
              })}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
              }}
              autoFocus
            />
            <button
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery("");
                setSearchResults([]);
              }}
              className={sprinkles({
                padding: 4,
              })}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <X size={18} />
            </button>
          </div>

          {isSearching && (
            <div
              style={{ textAlign: "center", padding: "20px", color: "#666" }}
            >
              검색 중...
            </div>
          )}

          {searchResults.length > 0 && (
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              {searchResults.map((employee) => (
                <div
                  key={employee.id}
                  onClick={() => addParticipant(employee)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px",
                    cursor: "pointer",
                    borderRadius: "4px",
                    gap: "12px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f5f5f5";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "#e0e0e0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    {employee.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: "500", fontSize: "14px" }}>
                      {employee.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {employee.email}
                      {employee.department && ` • ${employee.department}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchQuery && !isSearching && searchResults.length === 0 && (
            <div
              className={sprinkles({
                fontSize: "medium",
                color: "neutral_4",
                padding: 20,
              })}
              style={{
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParticipantManager;
