import React, { useMemo } from "react";
import { Clock, Copy, Folder } from "lucide-react";
import { sprinkles } from "../../styles/sprinkles.css";
import { header, sidebarButton } from "../../styles/meetingRecorder.css";
import Button from "../Button/Button";
import TitleEditor from "./TitleEditor";
import {
  formatDateTime,
  formatCurrentDateTime,
  useCurrentDateTime,
} from "../../utils/dateTime";
import { formatTime } from "../../utils/timeFormat";

interface HeaderProps {
  title: string;
  isEditingTitle: boolean;
  recordingTime: number;
  recordingStartTime?: Date | null;
  isMeetingCompleted?: boolean;
  selectedTab?: "conversation" | "script";
  onTitleChange: (title: string) => void;
  onTitleEdit: () => void;
  onTitleSave: (
    e:
      | React.KeyboardEvent<HTMLInputElement>
      | React.FocusEvent<HTMLInputElement>
  ) => void;
  onCopyNotes: () => void;
  onTabChange?: (tab: "conversation" | "script") => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  isEditingTitle,
  recordingTime,
  recordingStartTime,
  isMeetingCompleted = false,
  selectedTab = "conversation",
  onTitleChange,
  onTitleEdit,
  onTitleSave,
  onCopyNotes,
  onTabChange,
}) => {
  // 실시간 현재 시간 (recordingStartTime이 null일 때만 사용)
  const currentDateTime = useCurrentDateTime(60000); // 1분마다 업데이트

  // 표시할 시간 결정: recordingStartTime이 설정되면 고정, 아니면 실시간
  const displayDateTime = recordingStartTime
    ? formatDateTime(recordingStartTime)
    : currentDateTime;

  return (
    <div className={header}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <TitleEditor
          title={title}
          isEditing={isEditingTitle}
          onTitleChange={onTitleChange}
          onStartEdit={onTitleEdit}
          onSaveEdit={onTitleSave}
        />
      </div>

      <div
        className={sprinkles({
          fontSize: "small",
          color: "neutral_3",
        })}
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <span>{displayDateTime}</span>
        <span
          style={{
            marginLeft: "16px",
            display: "flex",
            alignItems: "center",
            background: "none",
          }}
        >
          <Clock
            className={sprinkles({
              color: "neutral_4",
            })}
            size={16}
            style={{ marginRight: "4px" }}
          />
          {formatTime(recordingTime)}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "16px",
        }}
      >
        <div style={{ display: "flex" }}>
          <Button
            variant={selectedTab !== "script" ? "primary" : "danger"}
            onClick={() => onTabChange?.("conversation")}
          >
            대화 기록
          </Button>
          <Button
            variant={selectedTab !== "conversation" ? "primary" : "danger"}
            style={{ marginLeft: "8px" }}
            onClick={() => onTabChange?.("script")}
          >
            스크립트
          </Button>
        </div>
        <button className={sidebarButton} onClick={onCopyNotes}>
          <Copy size={16} style={{ marginRight: "8px" }} />
          <span>노트 복사</span>
        </button>
      </div>
    </div>
  );
};

export default Header;
