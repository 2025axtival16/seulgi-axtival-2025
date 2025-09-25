import { style } from "@vanilla-extract/css";
import { sprinkles } from "./sprinkles.css";

export const button = style([
  sprinkles({
    borderRadius: "medium",
    padding: 8,
    fontSize: "small",
    fontWeight: "medium",
  }),
  {
    borderStyle: "solid",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    ":hover": {
      opacity: 0.9,
      transform: "translateY(-1px)",
    },
    ":active": {
      transform: "translateY(0)",
    },
    ":disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
]);
