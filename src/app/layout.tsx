import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GE Söka Bolag — AI Deal Sourcing",
  description: "AI-driven deal sourcing for industrial company acquisitions in Sweden",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex" style={{ background: "#f1f5f9", fontFamily: "var(--font-geist-sans)" }}>
        <Sidebar />
        <main style={{ flex: 1, overflow: "auto" }}>{children}</main>
      </body>
    </html>
  );
}
