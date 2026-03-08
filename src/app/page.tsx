"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Zap,
  Loader2,
  ArrowRight,
  Sparkles,
  Globe,
  BarChart3,
  Brain,
  FileText,
  Upload,
  Info,
} from "lucide-react";
import dynamic from "next/dynamic";
import Papa from "papaparse";
import type { AnalysisResult, ScrapeResult } from "@/lib/types";
import { EXAMPLE_POSTS } from "@/lib/example-data";

const InsightsDashboard = dynamic(
  () => import("@/components/InsightsDashboard"),
  { ssr: false }
);

const ComparisonDashboard = dynamic(
  () => import("@/components/ComparisonDashboard"),
  { ssr: false }
);

export default function Home() {
  const [url, setUrl] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<
    "idle" | "scraping" | "analyzing" | "done"
  >("idle");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [url2, setUrl2] = useState("");
  const [manualInput2, setManualInput2] = useState("");
  const [analysis2, setAnalysis2] = useState<AnalysisResult | null>(null);
  const [communityName1, setCommunityName1] = useState("");
  const [communityName2, setCommunityName2] = useState("");
  const [privateDetected, setPrivateDetected] = useState(false);
  const [customCommunityName, setCustomCommunityName] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);

  const urlTrimmed = url.trim();
  const hasUrl = urlTrimmed.length > 0;
  const isProfileUrl = hasUrl && /skool\.com\/@/.test(urlTrimmed);
  const isUrlValid = !hasUrl || (urlTrimmed.includes("skool.com") && !isProfileUrl);
  const url2Trimmed = url2.trim();
  const hasUrl2 = url2Trimmed.length > 0;
  const isProfile2Url = hasUrl2 && /skool\.com\/@/.test(url2Trimmed);
  const isUrl2Valid = !hasUrl2 || (url2Trimmed.includes("skool.com") && !isProfile2Url);
  const hasData = manualInput.trim().length > 0 || csvFile !== null;
  const canAnalyze = hasUrl || hasData;

  async function handleCsvUpload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large (max 5MB)");
      return;
    }

    const text = await file.text();
    if (text.trim().split("\n").length < 2) {
      setError("CSV file is empty or has no data rows");
      return;
    }

    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
    });

    if (!parsed.meta.fields?.includes("content")) {
      setError(
        'CSV must include a "content" column. Expected: author,content,likes,comments'
      );
      return;
    }

    const posts = parsed.data
      .map((row) => {
        const author = row["author"]?.trim() || "Member";
        const content = row["content"]?.trim() || "";
        const likes = parseInt(row["likes"]) || 0;
        const comments = parseInt(row["comments"]) || 0;
        return `[${author}] ${content} (${likes} likes, ${comments} comments)`;
      })
      .filter((line) => line.includes("]") && line.length > 20)
      .join("\n\n");

    setManualInput(posts);
    setCsvFile(file);
    setError("");
  }

  async function scrapeAndAnalyze(
    targetUrl: string,
    context: string
  ): Promise<{ result: AnalysisResult; name: string }> {
    let scrapeData: ScrapeResult;
    const trimmedUrl = targetUrl.trim();
    const hasTargetUrl =
      trimmedUrl.length > 0 && trimmedUrl.includes("skool.com");

    if (hasTargetUrl) {
      const scrapeRes = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl }),
      });
      if (!scrapeRes.ok) {
        const err = await scrapeRes.json();
        throw new Error(err.error || "Failed to scrape community");
      }
      scrapeData = await scrapeRes.json();

      // Detect private community
      if (scrapeData.dataQuality?.isPrivate) {
        setPrivateDetected(true);
      }
    } else {
      scrapeData = {
        communityName: customCommunityName || "Community Analysis",
        description: "Analysis based on provided community data",
        memberCount: "Unknown",
        posts: [],
      };
    }

    const analyzeRes = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...scrapeData,
        manualInput: context.trim() || undefined,
      }),
    });

    if (!analyzeRes.ok) {
      const err = await analyzeRes.json();
      throw new Error(err.error || "AI analysis failed");
    }

    const result: AnalysisResult = await analyzeRes.json();
    return { result, name: scrapeData.communityName };
  }

  async function handleAnalyze() {
    if (!canAnalyze) return;

    setLoading(true);
    setError("");
    setAnalysis(null);
    setAnalysis2(null);
    setPrivateDetected(false);

    try {
      if (compareMode && url2.trim()) {
        setStep("scraping");
        const results = await Promise.allSettled([
          scrapeAndAnalyze(url, manualInput),
          scrapeAndAnalyze(url2, manualInput2),
        ]);

        setStep("analyzing");

        const r1 =
          results[0].status === "fulfilled" ? results[0].value : null;
        const r2 =
          results[1].status === "fulfilled" ? results[1].value : null;

        if (!r1 && !r2) {
          throw new Error("Both community analyses failed");
        }

        if (r1) {
          setAnalysis(r1.result);
          setCommunityName1(r1.name);
        }
        if (r2) {
          setAnalysis2(r2.result);
          setCommunityName2(r2.name);
        }

        if (!r1 || !r2) {
          const failedIdx = !r1 ? 0 : 1;
          const failReason =
            results[failedIdx].status === "rejected"
              ? (results[failedIdx] as PromiseRejectedResult).reason?.message
              : "Unknown error";
          setError(
            `One community analysis failed: ${failReason}. Showing available results.`
          );
        }

        setStep("done");
      } else {
        setStep("scraping");
        const { result, name } = await scrapeAndAnalyze(url, manualInput);
        setStep("analyzing");
        setAnalysis(result);
        setCommunityName1(name);
        setStep("done");
      }

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("idle");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen gradient-bg dot-grid">
      {/* Ambient floating orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 print:hidden" aria-hidden="true">
        <div className="ambient-orb w-[600px] h-[600px] bg-indigo-500/[0.07] -top-[200px] left-[10%]" />
        <div className="ambient-orb w-[500px] h-[500px] bg-cyan-500/[0.05] top-[40%] -right-[100px]" style={{ animationDelay: "-8s" }} />
        <div className="ambient-orb w-[400px] h-[400px] bg-violet-500/[0.04] bottom-[10%] left-[5%]" style={{ animationDelay: "-15s" }} />
      </div>

      {/* Floating Navbar */}
      <header className="sticky top-0 z-50 print:hidden">
        <div className="mx-4 mt-3">
          <nav className="max-w-6xl mx-auto px-5 py-3 rounded-2xl bg-[#06060e]/70 backdrop-blur-xl border border-white/[0.06] shadow-lg shadow-black/20">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-indigo-500/25 transition-shadow">
                  <Brain className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="text-base font-semibold text-white tracking-tight">
                  Community Insights
                </span>
              </Link>
              <div className="flex items-center gap-4">
                <Link
                  href="/demo"
                  className="text-xs text-gray-400 hover:text-cyan-400 transition-colors focus-ring"
                >
                  Demo
                </Link>
                <a
                  href="https://www.skool.com/hackathon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors focus-ring"
                >
                  AI Hackathon 2026
                </a>
              </div>
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-8 pb-12 relative z-1">
        {/* Hero Section */}
        {!analysis && (
          <div className="text-center mb-14 animate-fade-in-up pt-6 relative">
            {/* Ambient glow behind title */}
            <div className="hero-glow print:hidden" aria-hidden="true" />

            <div className="relative">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/8 border border-cyan-500/15 text-cyan-400 text-xs mb-7">
                <Sparkles className="w-3.5 h-3.5" />
                Powered by Claude AI
              </div>
              <h1 className="text-4xl md:text-[60px] font-bold text-white mb-5 tracking-tight leading-[1.08]">
                Unlock Your Community&apos;s
                <br />
                <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent title-shimmer">
                  Hidden Insights
                </span>
              </h1>
              <p className="text-[15px] text-gray-400 max-w-lg mx-auto mb-10 leading-relaxed">
                Drop your Skool community URL and let AI reveal trending topics,
                engagement patterns, member dynamics, and actionable
                recommendations.
              </p>
            </div>

            {/* Features - glass containers */}
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-10">
              {[
                {
                  icon: Globe,
                  label: "Auto-scrape",
                  color: "text-indigo-400",
                  hoverBorder: "hover:border-indigo-500/20",
                  hoverShadow: "hover:shadow-indigo-500/5",
                },
                {
                  icon: Brain,
                  label: "AI analysis",
                  color: "text-cyan-400",
                  hoverBorder: "hover:border-cyan-500/20",
                  hoverShadow: "hover:shadow-cyan-500/5",
                },
                {
                  icon: BarChart3,
                  label: "Dashboards",
                  color: "text-violet-400",
                  hoverBorder: "hover:border-violet-500/20",
                  hoverShadow: "hover:shadow-violet-500/5",
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className={`group flex flex-col items-center gap-2 py-3.5 px-2 rounded-xl bg-white/[0.02] border border-white/[0.04] ${f.hoverBorder} transition-all ${f.hoverShadow} hover:shadow-lg`}
                >
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                  <span className="text-[11px] text-gray-500 group-hover:text-gray-400 transition-colors">
                    {f.label}
                  </span>
                </div>
              ))}
            </div>

            {/* See Demo CTA */}
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-6 py-2.5 mb-8 text-sm text-cyan-400 hover:text-white bg-cyan-500/8 hover:bg-cyan-500/15 border border-cyan-500/20 hover:border-cyan-500/40 rounded-xl transition-all cursor-pointer focus-ring"
            >
              <Sparkles className="w-4 h-4" />
              See Demo Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Input Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="glass-card rounded-2xl p-6">
            {/* Mode Toggle */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => {
                  setCompareMode(false);
                  setUrl2("");
                  setManualInput2("");
                  setAnalysis2(null);
                }}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer focus-ring ${!compareMode ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30" : "text-gray-500 hover:text-gray-300 border border-transparent"}`}
              >
                Single Analysis
              </button>
              <button
                onClick={() => setCompareMode(true)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer focus-ring ${compareMode ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30" : "text-gray-500 hover:text-gray-300 border border-transparent"}`}
              >
                Compare Communities
              </button>
            </div>

            {/* URL Input */}
            <div className="flex gap-3 mb-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={
                    compareMode
                      ? "Community A URL"
                      : "Skool community URL (optional if pasting data)"
                  }
                  aria-label={
                    compareMode ? "Community A URL" : "Skool community URL"
                  }
                  className={`w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 input-glow transition-all ${
                    hasUrl && !isUrlValid
                      ? "border-red-500/50"
                      : "border-white/[0.06]"
                  }`}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                />
                {hasUrl && !isUrlValid && (
                  <p
                    role="alert"
                    className="text-red-400 text-[11px] mt-1 ml-1"
                  >
                    {isProfileUrl
                      ? "Profile URLs are not supported. Please enter a community URL"
                      : "Please enter a valid skool.com URL"}
                  </p>
                )}
              </div>
              <button
                onClick={handleAnalyze}
                disabled={loading || !canAnalyze || (hasUrl && !isUrlValid) || (hasUrl2 && !isUrl2Valid)}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:from-gray-800 disabled:to-gray-800 text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2 disabled:cursor-not-allowed disabled:text-gray-500 cursor-pointer focus-ring shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 disabled:shadow-none"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {loading
                  ? "Analyzing..."
                  : compareMode
                    ? "Compare"
                    : "Analyze"}
              </button>
            </div>

            {/* Second URL for comparison */}
            {compareMode && (
              <div className="relative mb-3">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="url"
                  value={url2}
                  onChange={(e) => setUrl2(e.target.value)}
                  placeholder="Community B URL"
                  aria-label="Community B URL"
                  className={`w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 input-glow transition-all ${
                    hasUrl2 && !isUrl2Valid
                      ? "border-red-500/50"
                      : "border-white/[0.06]"
                  }`}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                />
                {hasUrl2 && !isUrl2Valid && (
                  <p
                    role="alert"
                    className="text-red-400 text-[11px] mt-1 ml-1"
                  >
                    {isProfile2Url
                      ? "Profile URLs are not supported. Please enter a community URL"
                      : "Please enter a valid skool.com URL"}
                  </p>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="divider-gradient my-4" />

            {/* Private community detection */}
            {privateDetected && (
              <div className="mb-3 flex items-start gap-2 px-3.5 py-2.5 bg-amber-500/[0.06] border border-amber-500/15 rounded-xl">
                <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-400/90">
                  This appears to be a private community. Paste your posts below for a more accurate analysis.
                </p>
              </div>
            )}

            {/* Community Name for manual-only mode */}
            {!hasUrl && (
              <div className="mb-3">
                <label htmlFor="community-name" className="text-xs text-gray-400 mb-1.5 block">
                  Community Name
                </label>
                <input
                  id="community-name"
                  type="text"
                  value={customCommunityName}
                  onChange={(e) => setCustomCommunityName(e.target.value)}
                  placeholder="e.g. My Skool Community"
                  className="w-full px-3.5 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 input-glow transition-all"
                />
              </div>
            )}

            {/* Always-visible textarea */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="manual-input"
                  className="text-xs text-gray-400"
                >
                  {compareMode ? "Community A posts" : "Paste community posts for deeper analysis"}
                </label>
                <button
                  onClick={() => {
                    setManualInput(EXAMPLE_POSTS);
                    setCsvFile(null);
                  }}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer focus-ring"
                >
                  Load Example Data
                </button>
              </div>
              <textarea
                id="manual-input"
                value={manualInput}
                onChange={(e) => {
                  setManualInput(e.target.value);
                  setCsvFile(null);
                }}
                placeholder={"[Author Name] Post content here (likes, comments)...\n\nTip: Copy posts from your Skool community feed and paste them here. Include author names, post text, and engagement numbers for best results."}
                className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 input-glow transition-all resize-none h-28"
              />
            </div>

            {/* Second textarea for comparison mode */}
            {compareMode && (
              <div className="mb-3">
                <label
                  htmlFor="manual-input-2"
                  className="text-xs text-gray-400 mb-2 block"
                >
                  Community B posts
                </label>
                <textarea
                  id="manual-input-2"
                  value={manualInput2}
                  onChange={(e) => setManualInput2(e.target.value)}
                  placeholder="[Author Name] Post content for Community B..."
                  className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 input-glow transition-all resize-none h-28"
                />
              </div>
            )}

            {/* CSV Upload */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-300 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg transition-all cursor-pointer focus-ring">
                <Upload className="w-3.5 h-3.5" />
                {csvFile ? csvFile.name : "Upload CSV"}
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  aria-label="Upload CSV file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCsvUpload(file);
                  }}
                />
              </label>
              <a
                href="/template.csv"
                download
                className="text-[11px] text-gray-500 hover:text-gray-400 transition-colors flex items-center gap-1 focus-ring"
              >
                <FileText className="w-3 h-3" />
                Download template
              </a>
            </div>
          </div>

          {/* Example URLs */}
          {!analysis && (
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
              <span>Try:</span>
              {[
                {
                  label: "AI Hackathon",
                  url: "https://www.skool.com/hackathon",
                },
                {
                  label: "AI Automation Society",
                  url: "https://www.skool.com/ai-automation-society",
                },
              ].map((ex, i) => (
                <span key={i} className="flex items-center gap-2">
                  {i > 0 && <span>/</span>}
                  <button
                    onClick={() => setUrl(ex.url)}
                    className="text-indigo-400/80 hover:text-indigo-300 transition-colors cursor-pointer focus-ring"
                  >
                    {ex.label}
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          {!analysis && (
            <p className="text-center text-[10px] text-gray-600 mt-3">
              Data sourced from publicly available pages. For deeper analysis,
              paste your community posts above.
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="max-w-2xl mx-auto" aria-live="polite">
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="relative w-16 h-16 mx-auto mb-5">
                {/* Spinning ring */}
                <svg className="w-16 h-16 animate-spin" viewBox="0 0 64 64">
                  <circle
                    cx="32" cy="32" r="28"
                    fill="none"
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="32" cy="32" r="28"
                    fill="none"
                    stroke="url(#loadGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="60 116"
                  />
                  <defs>
                    <linearGradient id="loadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-indigo-400" />
                </div>
              </div>
              <p className="text-white font-medium mb-1 text-lg">
                {step === "scraping"
                  ? "Scraping community data..."
                  : "AI is analyzing your community..."}
              </p>
              <p className="text-gray-500 text-sm mb-5">
                {step === "scraping"
                  ? "Fetching posts, members, and community metadata"
                  : "Identifying trends, sentiment, and generating insights"}
              </p>

              {/* Progress bar */}
              <div className="max-w-xs mx-auto h-1 bg-white/[0.04] rounded-full overflow-hidden mb-3">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full progress-pulse" />
              </div>

              <div className="flex items-center justify-center gap-3">
                <span className="text-xs text-gray-600">
                  {step === "scraping" ? "Step 1 of 2" : "Step 2 of 2"}
                </span>
                <span className="text-xs text-gray-600">
                  Usually 15-30 seconds
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8" role="alert">
            <div className="bg-red-500/[0.06] border border-red-500/15 rounded-xl p-4">
              <p className="text-red-400 font-medium text-sm">
                Analysis failed
              </p>
              <p className="text-red-400/70 text-sm mt-1">{error}</p>
              <button
                onClick={handleAnalyze}
                className="mt-3 flex items-center gap-1 text-xs text-red-400/80 hover:text-red-300 transition-colors cursor-pointer focus-ring"
              >
                Try again <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        <div ref={resultsRef}>
          {analysis && analysis2 && (
            <ComparisonDashboard
              data1={analysis}
              data2={analysis2}
              name1={communityName1}
              name2={communityName2}
            />
          )}
          {analysis && !analysis2 && <InsightsDashboard data={analysis} />}
          {!analysis && analysis2 && <InsightsDashboard data={analysis2} />}
        </div>
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
