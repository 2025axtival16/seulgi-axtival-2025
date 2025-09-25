"use client";

import { ReactNode } from "react";
import { button } from "../../styles/button.css";
import { sprinkles, type Sprinkles } from "../../styles/sprinkles.css";

type ButtonProps = {
  variant?: "primary" | "secondary" | "danger";
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
} & Partial<Sprinkles>;

export default function Button({
  variant = "primary",
  children,
  onClick,
  className,
  style,
  ...sprinkleProps
}: ButtonProps) {
  const variantStyles = {
    primary: sprinkles({
      color: "neutral",
      backgroundColor: "primary",
      borderWidth: "small",
      borderColor: "primary",
    }),
    secondary: sprinkles({
      color: "neutral_5",
      backgroundColor: "neutral_2",
      borderWidth: "small",
      borderColor: "neutral_3",
    }),
    danger: sprinkles({
      color: "primary",
      backgroundColor: "neutral",
      borderWidth: "small",
      borderColor: "primary",
    }),
  };

  const customSprinkles = sprinkles(sprinkleProps);

  const allClasses = [
    button,
    variantStyles[variant],
    customSprinkles,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={allClasses} onClick={onClick} style={style}>
      {children || "Click Me"}
    </button>
  );
}
