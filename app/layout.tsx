import type { Metadata } from "next";
import "./globals.css";
import { Header } from "./components/Header";

export const metadata: Metadata = {
  title: "기타비교 - 일렉기타 가격 비교 플랫폼",
  description: "국내 주요 악기 쇼핑몰 10곳의 일렉기타 가격을 한눈에 비교하고 최저가를 찾아보세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <Header />
        {children}
      </body>
    </html>
  );
}
