import { style } from "@vanilla-extract/css";
import { sprinkles } from "./sprinkles.css";

export const container = style([
  sprinkles({
    backgroundColor: "neutral_1",
  }),
  {
    height: "100vh",
    display: "flex",
  },
]);

export const sidebar = style([
  sprinkles({
    backgroundColor: "neutral_1",
    borderColor: "neutral_2",
    padding: 16,
    borderWidth: "small",
  }),
  {
    width: "256px",
    borderRightStyle: "solid",
  },
]);

export const mainContent = style([
  sprinkles({
    backgroundColor: "neutral",
  }),
  {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
]);

export const rightPanel = style([
  sprinkles({
    backgroundColor: "neutral_1",
    borderColor: "neutral_2",
  }),
  {
    width: "400px",
    borderLeftWidth: "1px",
    borderLeftStyle: "solid",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
  },
]);

export const rightPanelContent = style([
  sprinkles({
    padding: 16,
  }),
  {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
]);

export const header = style([
  sprinkles({
    backgroundColor: "neutral",
    padding: 24,
  }),
]);

export const sectionContainer = style([
  sprinkles({
    backgroundColor: "neutral",
  }),
  {
    paddingLeft: "24px",
    paddingRight: "24px",
    paddingTop: "0px",
    paddingBottom: "12px",
    marginBottom: "0px",
  },
]);

export const sectionTitle = style([
  sprinkles({
    fontSize: "medium",
    fontWeight: "semibold",
    color: "neutral_6",
  }),
  {
    marginBottom: "12px",
  },
]);

export const contentArea = style([
  sprinkles({
    padding: 24,
  }),
  {
    flex: 1,
  },
]);

export const contentCard = style([
  sprinkles({
    backgroundColor: "neutral",
    borderRadius: "medium",
    padding: 24,
  }),
  {
    maxHeight: "calc(100vh - 200px)", // 뷰포트에서 헤더/여백 제외
    overflow: "hidden", // 내부 스크롤 컨테이너에서 스크롤 처리
    display: "flex",
    flexDirection: "column",
  },
]);

export const bottomControls = style([
  sprinkles({
    backgroundColor: "neutral",
    borderColor: "neutral_2",
  }),
  {
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "50px",
    margin: "16px auto",
    maxWidth: "400px",
    display: "inline-block",
    paddingTop: "16px",
    paddingBottom: "16px",
    paddingLeft: "32px",
    paddingRight: "32px",
  },
]);

export const recordButton = style([
  sprinkles({
    backgroundColor: "primary",
  }),
  {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "background-color 0.2s",
    ":hover": {
      opacity: 0.9,
    },
  },
]);

export const controlButton = style([
  sprinkles({
    backgroundColor: "neutral",
  }),
  {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 0 0 1px #e6007e",
    ":hover": {
      backgroundColor: "#f8bfe0",
      boxShadow: "0 0 0 1px #f8bfe0",
    },
  },
]);

export const recordingIndicator = style({
  width: "16px",
  height: "16px",
  borderRadius: "50%",
});

export const recordingIndicatorActive = style([
  recordingIndicator,
  {
    backgroundColor: "#e22a21",
    animation: "pulse 2s infinite",
  },
]);

export const recordingIndicatorPaused = style([
  recordingIndicator,
  {
    backgroundColor: "#f86800",
  },
]);

export const titleInput = style([
  sprinkles({
    fontSize: "2xlarge",
    fontWeight: "semibold",
  }),
  {
    background: "transparent",
    border: "none",
    outline: "none",
  },
]);

export const sidebarButton = style([
  sprinkles({
    color: "neutral_4",
    padding: 8,
  }),
  {
    display: "flex",
    alignItems: "center",
    background: "none",
    border: "none",
    cursor: "pointer",
    transition: "color 0.2s",
    ":hover": {
      color: "#e6007e",
    },
  },
]);

export const rightPanelToggleButton = style([
  sprinkles({
    color: "neutral_4",
  }),
  {
    position: "fixed",
    top: "24px",
    width: "40px",
    height: "40px",
    backgroundColor: "transparent",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 1000,
    transition: "color 0.2s ease",
    ":hover": {
      color: "#e6007e",
    },
  },
]);

export const rightPanelToggleButtonOpen = style([
  rightPanelToggleButton,
  sprinkles({
    color: "primary",
  }),
  {
    right: "424px",
  },
]);

export const rightPanelToggleButtonClosed = style([
  rightPanelToggleButton,
  {
    right: "24px",
  },
]);

export const rightPanelCollapsed = style([
  sprinkles({
    backgroundColor: "neutral_1",
    borderColor: "neutral_2",
  }),
  {
    width: "0px",
    borderLeftWidth: "0px",
    overflow: "hidden",
    transition: "width 0.3s ease",
    height: "100vh",
  },
]);

export const rightPanelExpanded = style([
  sprinkles({
    backgroundColor: "neutral_1",
    borderColor: "neutral_2",
  }),
  {
    width: "400px",
    borderLeftWidth: "1px",
    borderLeftStyle: "solid",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    transition: "width 0.3s ease",
  },
]);

// Left Panel Styles
export const leftPanel = style([
  sprinkles({
    padding: 16,
  }),
  {
    width: "400px",
    background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
    borderRight: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    overflowY: "auto",
    position: "relative",
    boxShadow: "inset -1px 0 0 0 rgba(0,0,0,0.05)",
  },
]);

export const leftPanelTitle = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  borderBottom: "2px solid #e2e8f0",
  paddingBottom: "16px",
  margin: "-16px -16px 20px -16px",
  padding: "16px 16px 16px 16px",
  backdropFilter: "blur(10px)",
  position: "sticky",
  top: "0",
  zIndex: 10,
});

export const leftPanelContent = style({
  flex: 1,
  overflowY: "auto",
  padding: "0 4px",
});

export const commentCard = style([
  sprinkles({
    backgroundColor: "neutral",
    borderColor: "neutral_2",
    padding: 12,
    borderRadius: "medium",
    borderWidth: "small",
  }),
  {
    marginBottom: "12px",
    borderStyle: "solid",
    cursor: "default",
  },
]);

export const commentCardTitle = style([
  sprinkles({
    color: "primary",
  }),
  {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "8px",
    lineHeight: "1.4",
  },
]);

export const commentCardUrl = style({
  background: "none",
  border: "1px solid #3b82f6",
  borderRadius: "4px",
  padding: "4px 8px",
  color: "#3b82f6",
  fontSize: "12px",
  cursor: "pointer",
  marginBottom: "12px",
  transition: "all 0.2s",
  ":hover": {
    backgroundColor: "#3b82f6",
    color: "white",
  },
});

export const commentList = style({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
});

export const commentItem = style([
  sprinkles({
    backgroundColor: "neutral_1",
    padding: 8,
    borderRadius: "small",
  }),
  {
    fontSize: "14px",
    lineHeight: "1.5",
    color: "#374151",
    whiteSpace: "pre-wrap",
  },
]);

export const loadingState = style({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "48px 32px",
  color: "#6b7280",
  fontSize: "14px",
  minHeight: "200px",
});

export const errorState = style([
  sprinkles({
    padding: 24,
    borderRadius: "medium",
  }),
  {
    backgroundColor: "#e5e7fa",
    border: "2px solid #5e4db5",
    borderStyle: "solid",
    color: "#5e4db5",
    fontSize: "14px",
    textAlign: "center",
    margin: "20px 8px",
    minHeight: "180px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
]);
