"use client";

import Link from "next/link";
import { Brain, ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import { DEMO_ANALYSIS } from "@/lib/demo-data";

const InsightsDashboard = dynamic(
  () => import("@/components/InsightsDashboard"),
  { ssr: false }
);

export default function DemoPage() {
  return (
    <div className="min-h-screen gradient-bg dot-grid">
      {/* Ambient floating orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 print:hidden" aria-hidden="true">
        <div className="ambient-orb w-[500px] h-[500px] bg-indigo-500/[0.06] -top-[150px] left-[15%]" />
        <div className="ambient-orb w-[400px] h-[400px] bg-cyan-500/[0.05] top-[50%] -right-[80px]" style={{ animationDelay: "-10s" }} />
      </div>

      {/* Floating Navbar */}
      <nav className="fixed top-4 left-4 right-4 z-50 print:hidden">
        <div className="max-w-6xl mx-auto px-5 py-3 rounded-2xl bg-[#06060e]/70 backdrop-blur-xl border border-white/[0.06] shadow-lg shadow-black/20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 cursor-pointer group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/30 transition-shadow">
              <Brain className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-base font-semibold text-white tracking-tight">
              Community Insights
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer focus-ring"
          >
            Try with your own community
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 pt-24 pb-8 relative z-1">
        {/* Demo banner */}
        <div className="text-center mb-6 print:hidden">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/8 border border-cyan-500/15 text-sm">
            <span className="text-cyan-400 font-medium">
              Demo Dashboard
            </span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400">
              AI Hackathon 2026 Community Analysis
            </span>
          </div>
        </div>

        <InsightsDashboard data={DEMO_ANALYSIS} />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-6 mt-12 print:hidden relative z-1">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-gray-600">
          Built by Insight Builders | AI Hackathon 2026 | Powered by Claude AI
        </div>
      </footer>
    </div>
  );
}
