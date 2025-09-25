import { defineProperties, createSprinkles } from "@vanilla-extract/sprinkles";

const space = {
  none: 0,
  small: 4,
  medium: 8,
  large: 16,
};

export const colors = {
  // U+ 브랜드 색상
  uplus_magenta: {
    10: "#fefbfd",
    50: "#fdedf6",
    100: "#fbdaed",
    200: "#f8bfe0",
    300: "#ee96c9",
    400: "#e667b1",
    500: "#e6007e", // 메인 브랜드 색상
    600: "#b20068",
    700: "#8a0050",
    800: "#66003c",
    900: "#47002a",
  },
  uplus_navy: {
    10: "#f0f2fd",
    50: "#e5e7fa",
    100: "#d8dff6",
    200: "#b2b6ef",
    300: "#9292e7",
    400: "#7f78dc",
    500: "#6e5dce",
    600: "#5e4db5",
    700: "#4d4192",
    800: "#413a75",
    900: "#1e1a34",
  },

  // 뉴트럴 색상 (Blue Gray)
  blue_gray: {
    10: "#fcfcfd",
    50: "#f9fafb",
    100: "#f3f5f6",
    200: "#e7ebee",
    300: "#dce0e5",
    400: "#a8b3bd",
    500: "#7f8a94",
    600: "#66707a",
    700: "#525960",
    800: "#3b4044",
    900: "#181a1b",
  },

  // 시스템 색상
  blue: {
    10: "#f5f8fe",
    50: "#e2ebfd",
    100: "#b1cafb",
    200: "#78a2f7",
    300: "#4580f7",
    400: "#1662f8",
    500: "#0146d0",
    600: "#013aad",
    700: "#002b80",
    800: "#001d57",
    900: "#001133",
  },
  green: {
    10: "#f6fef6",
    50: "#dffbdf",
    100: "#acf6ad",
    200: "#6af66c",
    300: "#3ae93c",
    400: "#00cc02",
    500: "#00aa02",
    600: "#008502",
    700: "#256023",
    800: "#004d01",
    900: "#003301",
  },
  red: {
    10: "#fef6f6",
    50: "#fbdcda",
    100: "#f8c6c3",
    200: "#f39591",
    300: "#ed615a",
    400: "#e93d35",
    500: "#e22a21",
    600: "#ba231c",
    700: "#a71009",
    800: "#671714",
    900: "#4d120f",
  },
  orange: {
    10: "#fff9f5",
    50: "#ffe7d6",
    100: "#ffd3b3",
    200: "#ffbb8a",
    300: "#ff9d57",
    400: "#ff8024",
    500: "#f86800",
    600: "#e05e00",
    700: "#b04a00",
    800: "#773506",
    900: "#662b00",
  },
  yellow: {
    10: "#fffdf5",
    50: "#fffae0",
    100: "#fff6c2",
    200: "#fff1a3",
    300: "#ffe970",
    400: "#ffdf33",
    500: "#fdd600",
    600: "#f0cb00",
    700: "#e0be00",
    800: "#d1b100",
    900: "#b89b00",
  },

  // 베이스 색상
  black: "#000000",
  white: "#ffffff",
};

export const semanticColors = {
  // 텍스트 (숫자가 클수록 더 진한 색상)
  text: {
    neutral: "#ffffff", // 흰색
    neutral_1: "#a8b3bd", // 가장 연한 회색
    neutral_2: "#7f8a94", // 연한 회색
    neutral_3: "#66707a", // 중간 회색
    neutral_4: "#525960", // 진한 회색
    neutral_5: "#3b4044", // 더 진한 회색
    neutral_6: "#181a1b", // 가장 진한 회색
    primary: "#e6007e",
    secondary: "#1e1a34",
    on_primary: "#ffffff",
    on_secondary: "#ffffff",
  },

  // 배경/컨테이너 (숫자가 클수록 더 진한 색상)
  container: {
    neutral: "#ffffff", // 흰색
    neutral_1: "#f9fafb", // 가장 연한 회색
    neutral_2: "#f3f5f6", // 연한 회색
    neutral_3: "#e7ebee", // 중간 회색
    neutral_4: "#dce0e5", // 진한 회색
    neutral_5: "#a8b3bd", // 더 진한 회색
    neutral_6: "#525960", // 가장 진한 회색
    primary: "#e6007e",
    primary_low: "#fdedf6",
    secondary: "#1e1a34",
  },

  // 보더 (숫자가 클수록 더 진한 색상)
  border: {
    neutral: "#ffffff", // 흰색
    neutral_1: "#f3f5f6", // 가장 연한 회색
    neutral_2: "#e7ebee", // 연한 회색
    neutral_3: "#dce0e5", // 중간 회색
    neutral_4: "#a8b3bd", // 진한 회색
    neutral_5: "#7f8a94", // 더 진한 회색
    neutral_6: "#525960", // 가장 진한 회색
    primary: "#e6007e",
    secondary: "#1e1a34",
  },

  // 아이콘 (숫자가 클수록 더 진한 색상)
  icon: {
    neutral: "#ffffff", // 흰색
    neutral_1: "#a8b3bd", // 가장 연한 회색
    neutral_2: "#7f8a94", // 연한 회색
    neutral_3: "#66707a", // 중간 회색
    neutral_4: "#525960", // 진한 회색
    neutral_5: "#3b4044", // 더 진한 회색
    neutral_6: "#181a1b", // 가장 진한 회색
    primary: "#e6007e",
    secondary: "#1e1a34",
  },

  // 상태
  status: {
    success: "#00aa02",
    error: "#e22a21",
    warning: "#f86800",
    info: "#1662f8",
  },
};

export const fontTokens = {
  family: {
    sans: "Pretendard",
  },

  size: {
    "2xsmall": "10px",
    xsmall: "12px",
    small: "14px",
    medium: "16px",
    large: "18px",
    xlarge: "20px",
    "2xlarge": "24px",
    "3xlarge": "28px",
  },

  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    normal: "normal",
    small: 1.3,
    medium: 1.4,
    large: 1.5,
  },
};

export const typography = {
  // Heading
  heading_1B: { size: "28px", weight: 700, lineHeight: 1.3 },
  heading_1Sb: { size: "28px", weight: 600, lineHeight: 1.3 },
  heading_2B: { size: "24px", weight: 700, lineHeight: 1.3 },
  heading_2Sb: { size: "24px", weight: 600, lineHeight: 1.3 },
  heading_3B: { size: "20px", weight: 700, lineHeight: 1.4 },
  heading_3Sb: { size: "20px", weight: 600, lineHeight: 1.4 },
  heading_4B: { size: "18px", weight: 700, lineHeight: 1.4 },
  heading_4Sb: { size: "18px", weight: 600, lineHeight: 1.4 },
  heading_5B: { size: "16px", weight: 700, lineHeight: 1.4 },
  heading_5Sb: { size: "16px", weight: 600, lineHeight: 1.4 },
  heading_6B: { size: "14px", weight: 700, lineHeight: 1.4 },
  heading_6Sb: { size: "14px", weight: 600, lineHeight: 1.4 },

  // Body
  body_1Sb: { size: "16px", weight: 600, lineHeight: 1.5 },
  body_1M: { size: "16px", weight: 500, lineHeight: 1.5 },
  body_2Sb: { size: "14px", weight: 600, lineHeight: 1.5 },
  body_2M: {
    size: "14px",
    weight: 500,
    lineHeight: 1.5,
    letterSpacing: "-0.02em",
  },
  body_3Sb: { size: "12px", weight: 600, lineHeight: 1.4 },
  body_3M: { size: "12px", weight: 500, lineHeight: 1.4 },

  // Label
  label_1Sb: { size: "16px", weight: 600, lineHeight: "normal" },
  label_1M: { size: "16px", weight: 500, lineHeight: "normal" },
  label_2Sb: { size: "16px", weight: 600, lineHeight: "normal" },
  label_2M: { size: "16px", weight: 500, lineHeight: "normal" },
  label_3Sb: { size: "14px", weight: 600, lineHeight: "normal" },
  label_3M: { size: "14px", weight: 500, lineHeight: "normal" },
  label_4Sb: { size: "12px", weight: 600, lineHeight: "normal" },
  label_4M: { size: "12px", weight: 500, lineHeight: "normal" },
  label_5Sb: { size: "10px", weight: 600, lineHeight: "normal" },
  label_5M: { size: "12px", weight: 500, lineHeight: "normal" },

  // Detail
  detail_1B: { size: "16px", weight: 700, lineHeight: "normal" },
  detail_1Sb: { size: "16px", weight: 600, lineHeight: 1.5 },
  detail_1M: { size: "16px", weight: 500, lineHeight: 1.5 },
  detail_2B: { size: "14px", weight: 700, lineHeight: 1.5 },
  detail_2Sb: { size: "14px", weight: 600, lineHeight: 1.5 },
  detail_2M: { size: "14px", weight: 500, lineHeight: 1.5 },
  detail_3B: { size: "12px", weight: 700, lineHeight: 1.4 },
  detail_3Sb: { size: "12px", weight: 600, lineHeight: 1.4 },
  detail_3M: { size: "12px", weight: 500, lineHeight: 1.4 },

  // Sup
  sup_1B: { size: "28px", weight: 700, lineHeight: "normal" },
  sup_2M: { size: "16px", weight: 500, lineHeight: "normal" },
  sup_3M: { size: "14px", weight: 500, lineHeight: "normal" },
};

export const spacing = {
  0: "0px",
  2: "2px",
  4: "4px",
  8: "8px",
  12: "12px",
  16: "16px",
  20: "20px",
  24: "24px",
  28: "28px",
  32: "32px",
  40: "40px",
  44: "44px",
  48: "48px",
  56: "56px",
};

export const borderRadius = {
  xsmall: "4px",
  small: "6px",
  medium: "8px",
  large: "12px",
  xlarge: "20px",
  full: "50%",
};

export const borderWidth = {
  small: "1px",
  medium: "2px",
};

export const boxShadow = {
  1: "0px 3px 8px 0px rgba(59,64,68, 0.08)",
  2: "0px 5px 10px 0px rgba(59,64,68, 0.08)",
  3: "0px 7px 12px 0px rgba(59,64,68, 0.08)",
  4: "0px 9px 15px 0px rgba(59,64,68, 0.08)",
};

export const zIndex = {
  1: 25,
  2: 50,
  3: 75,
  4: 99,
};

const colorProperties = defineProperties({
  properties: {
    color: semanticColors.text,
    backgroundColor: semanticColors.container,
    borderColor: semanticColors.border,
  },
});

const layoutProperties = defineProperties({
  properties: {
    padding: spacing,
    margin: spacing,
    borderRadius: borderRadius,
    borderWidth: borderWidth,
  },
});

const typographyProperties = defineProperties({
  properties: {
    fontSize: fontTokens.size,
    fontWeight: fontTokens.weight,
    lineHeight: fontTokens.lineHeight,
    fontFamily: fontTokens.family,
  },
});

export const sprinkles = createSprinkles(
  colorProperties,
  layoutProperties,
  typographyProperties
);

export type Sprinkles = Parameters<typeof sprinkles>[0];
