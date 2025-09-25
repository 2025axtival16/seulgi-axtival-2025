import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Umeet",
  description: "AI 기반 회의 녹음, 전사, 요약 및 RAG 질의응답 시스템",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/variable/pretendardvariable-dynamic-subset.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/variable/pretendardvariable-dynamic-subset.css"
        />
      </head>
      <body style={{ fontFamily: "Pretendard Variable, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
