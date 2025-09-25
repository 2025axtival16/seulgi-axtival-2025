import { style, keyframes } from "@vanilla-extract/css";
import { sprinkles } from "./sprinkles.css";

const slideUp = keyframes({
  from: {
    opacity: 0,
    transform: "translate(-50%, 100%)",
  },
  to: {
    opacity: 1,
    transform: "translate(-50%, 0)",
  },
});

export const toastContainer = style({
  position: "fixed",
  bottom: "160px",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 9999,
  animation: `${slideUp} 0.3s ease-out`,
  pointerEvents: "none",
});

export const toastContent = style([
  sprinkles({
    backgroundColor: "neutral_6",
    color: "neutral",
    fontSize: "medium",
    padding: 16,
    borderRadius: "medium",
  }),
  {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    minWidth: "200px",
    maxWidth: "400px",
    justifyContent: "center",
    pointerEvents: "auto",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
]);
