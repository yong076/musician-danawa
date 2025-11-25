import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "뮤지션 다나와 - 악기 가격 비교",
  description: "한국의 모든 악기 상점을 비교하여 최저가를 찾아보세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  );
}
