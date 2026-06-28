import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "회사 맛집 지도",
  description: "회사 주변 맛집을 카테고리별로 모아보고, 직접 추가할 수 있는 지도",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
