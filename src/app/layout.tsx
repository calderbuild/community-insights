import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Community Insights Engine - AI-Powered Community Analytics",
  description:
    "Unlock hidden insights from your Skool community with AI-powered analysis. Discover trending topics, member engagement patterns, and actionable recommendations.",
  openGraph: {
    title: "Community Insights Engine",
    description:
      "AI-powered analytics dashboard for Skool communities. Discover trends, engagement patterns, and growth recommendations.",
    url: "https://community-insights-virid.vercel.app",
    type: "website",
    siteName: "Community Insights",
  },
  twitter: {
    card: "summary_large_image",
    title: "Community Insights Engine",
    description:
      "AI-powered analytics for Skool communities. Trending topics, health scores, and growth playbooks.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#06060e]`}
      >
        {children}
      </body>
    </html>
  );
}
