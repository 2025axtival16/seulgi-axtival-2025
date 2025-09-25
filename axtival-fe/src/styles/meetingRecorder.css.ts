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
    paddingBottom: "0px",
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
    height: "100%",
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
