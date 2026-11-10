import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Board Tracker",
  description: "상장사 이사회 구성원 조회 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.className} h-full`}>
      <body className="min-h-full flex flex-col bg-[#F9F9FB] text-[#1A1A1A]">
        {children}
        <footer className="bg-white border-t border-[#ECECEC] py-4 px-6 text-right">
          <span className="text-xs text-[#8A8A9A]">by Eddie Jung</span>
        </footer>
      </body>
    </html>
  );
}
