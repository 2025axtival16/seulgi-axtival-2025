import React from "react";
import { Plus, Share } from "lucide-react";
import { sidebar, sidebarButton } from "../../styles/meetingRecorder.css";

const Sidebar = () => {
  return (
    <div className={sidebar}>
      <div style={{ marginBottom: "24px" }}>
        <button className={sidebarButton} style={{ marginBottom: "12px" }}>
          <Plus size={16} style={{ marginRight: "8px" }} />새 노트
        </button>
        <button className={sidebarButton}>
          <Share size={16} style={{ marginRight: "8px" }} />
          음성 파일 업로드
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
