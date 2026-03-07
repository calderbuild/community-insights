"use client";

import type { AnalysisResult } from "@/lib/types";
import {
  Activity,
  TrendingUp,
  Users,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";

function scoreColor(score: number): string {
  if (score >= 70) return "#34d399";
  if (score >= 40) return "#fbbf24";
  return "#f87171";
}

function DeltaBadge({ a, b }: { a: number; b: number }) {
  const delta = a - b;
  if (delta === 0)
    return (
      <span className="flex items-center text-xs text-gray-500">
        <Minus className="w-3 h-3" /> 0
      </span>
    );

  return (
    <span
      className={`flex items-center text-xs font-medium ${delta > 0 ? "text-emerald-400" : "text-red-400"}`}
    >
      {delta > 0 ? (
        <ArrowUpRight className="w-3 h-3" />
      ) : (
        <ArrowDownRight className="w-3 h-3" />
      )}
      {Math.abs(delta)}
    </span>
  );
}

function MiniGauge({
  score,
  size = 120,
  color,
}: {
  score: number;
  size?: number;
  color: string;
}) {
  const r = (size - 16) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * circumference} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="health-gauge-fill"
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{score}</span>
      </div>
    </div>
  );
}

export default function ComparisonDashboard({
  data1,
  data2,
  name1,
  name2,
}: {
  data1: AnalysisResult;
  data2: AnalysisResult;
  name1: string;
  name2: string;
}) {
  const h1 = data1.healthScore;
  const h2 = data2.healthScore;

  // Find shared and unique topics
  const topics1 = new Set(data1.topTopics.map((t) => t.topic.toLowerCase()));
  const topics2 = new Set(data2.topTopics.map((t) => t.topic.toLowerCase()));
  const sharedTopics = data1.topTopics.filter((t) =>
    topics2.has(t.topic.toLowerCase())
  );
  const uniqueTopics1 = data1.topTopics.filter(
    (t) => !topics2.has(t.topic.toLowerCase())
  );
  const uniqueTopics2 = data2.topTopics.filter(
    (t) => !topics1.has(t.topic.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Health Score Comparison */}
      <div className="glass-card rounded-2xl p-6 animate-fade-in-up">
        <h3 className="text-base font-semibold text-white mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          Health Score Comparison
        </h3>

        <div className="grid md:grid-cols-3 gap-6 items-center">
          {/* Community A */}
          <div className="text-center">
            <p className="text-sm font-medium text-indigo-400 mb-3 truncate">
              {name1}
            </p>
            <div className="flex justify-center">
              <MiniGauge
                score={h1.overall}
                color={scoreColor(h1.overall)}
              />
            </div>
          </div>

          {/* Delta */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Delta</p>
              <p
                className={`text-3xl font-bold ${h1.overall - h2.overall > 0 ? "text-emerald-400" : h1.overall - h2.overall < 0 ? "text-red-400" : "text-gray-400"}`}
              >
                {h1.overall - h2.overall > 0 ? "+" : ""}
                {h1.overall - h2.overall}
              </p>
            </div>
          </div>

          {/* Community B */}
          <div className="text-center">
            <p className="text-sm font-medium text-emerald-400 mb-3 truncate">
              {name2}
            </p>
            <div className="flex justify-center">
              <MiniGauge
                score={h2.overall}
                color={scoreColor(h2.overall)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Comparison Table */}
      <div
        className="glass-card rounded-2xl p-6 animate-fade-in-up"
        style={{ animationDelay: "80ms" }}
      >
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          Key Metrics
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs">
                <th className="text-left py-2 pr-4">Metric</th>
                <th className="text-center py-2 px-4 text-indigo-400">
                  {name1.length > 20 ? name1.slice(0, 20) + "..." : name1}
                </th>
                <th className="text-center py-2 px-4 text-emerald-400">
                  {name2.length > 20 ? name2.slice(0, 20) + "..." : name2}
                </th>
                <th className="text-center py-2 pl-4">Delta</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {[
                {
                  label: "Overall Health",
                  icon: <Activity className="w-4 h-4 text-indigo-400" />,
                  a: h1.overall,
                  b: h2.overall,
                },
                {
                  label: "Content Quality",
                  icon: null,
                  a: h1.contentQuality,
                  b: h2.contentQuality,
                },
                {
                  label: "Engagement",
                  icon: null,
                  a: h1.engagement,
                  b: h2.engagement,
                },
                {
                  label: "Growth",
                  icon: null,
                  a: h1.growth,
                  b: h2.growth,
                },
                {
                  label: "Leadership",
                  icon: null,
                  a: h1.leadership,
                  b: h2.leadership,
                },
                {
                  label: "Positivity",
                  icon: null,
                  a: h1.positivity,
                  b: h2.positivity,
                },
                {
                  label: "Total Posts",
                  icon: <MessageSquare className="w-4 h-4 text-purple-400" />,
                  a: data1.totalPosts,
                  b: data2.totalPosts,
                },
                {
                  label: "Active Members",
                  icon: <Users className="w-4 h-4 text-blue-400" />,
                  a: data1.activeMembersCount,
                  b: data2.activeMembersCount,
                },
                {
                  label: "Positive Sentiment",
                  icon: null,
                  a: data1.sentiment.positive,
                  b: data2.sentiment.positive,
                  suffix: "%",
                },
              ].map((row, i) => (
                <tr
                  key={i}
                  className="border-t border-white/[0.04]"
                >
                  <td className="py-3 pr-4 flex items-center gap-2">
                    {row.icon}
                    {row.label}
                  </td>
                  <td className="py-3 px-4 text-center font-medium">
                    {row.a.toLocaleString()}
                    {"suffix" in row ? row.suffix : ""}
                  </td>
                  <td className="py-3 px-4 text-center font-medium">
                    {row.b.toLocaleString()}
                    {"suffix" in row ? row.suffix : ""}
                  </td>
                  <td className="py-3 pl-4 text-center">
                    <DeltaBadge a={row.a} b={row.b} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Topic Overlap */}
      <div
        className="glass-card rounded-2xl p-6 animate-fade-in-up"
        style={{ animationDelay: "160ms" }}
      >
        <h3 className="text-base font-semibold text-white mb-4">
          Topic Overlap
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Unique to A */}
          <div>
            <p className="text-xs text-indigo-400 font-medium mb-2">
              Only in {name1.length > 15 ? name1.slice(0, 15) + "..." : name1}
            </p>
            <div className="space-y-1.5">
              {uniqueTopics1.length > 0 ? (
                uniqueTopics1.map((t, i) => (
                  <div
                    key={i}
                    className="text-sm text-gray-400 bg-indigo-500/[0.05] border border-indigo-500/10 rounded-lg px-3 py-1.5"
                  >
                    {t.topic}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-600">No unique topics</p>
              )}
            </div>
          </div>

          {/* Shared */}
          <div>
            <p className="text-xs text-purple-400 font-medium mb-2">Shared</p>
            <div className="space-y-1.5">
              {sharedTopics.length > 0 ? (
                sharedTopics.map((t, i) => (
                  <div
                    key={i}
                    className="text-sm text-gray-400 bg-purple-500/[0.05] border border-purple-500/10 rounded-lg px-3 py-1.5"
                  >
                    {t.topic}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-600">No shared topics</p>
              )}
            </div>
          </div>

          {/* Unique to B */}
          <div>
            <p className="text-xs text-emerald-400 font-medium mb-2">
              Only in {name2.length > 15 ? name2.slice(0, 15) + "..." : name2}
            </p>
            <div className="space-y-1.5">
              {uniqueTopics2.length > 0 ? (
                uniqueTopics2.map((t, i) => (
                  <div
                    key={i}
                    className="text-sm text-gray-400 bg-emerald-500/[0.05] border border-emerald-500/10 rounded-lg px-3 py-1.5"
                  >
                    {t.topic}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-600">No unique topics</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-side Recommendations */}
      <div
        className="grid md:grid-cols-2 gap-6 animate-fade-in-up"
        style={{ animationDelay: "240ms" }}
      >
        {[
          { data: data1, name: name1, color: "indigo" },
          { data: data2, name: name2, color: "emerald" },
        ].map((side, si) => (
          <div key={si} className="glass-card rounded-2xl p-6">
            <h3
              className={`text-sm font-semibold mb-3 ${si === 0 ? "text-indigo-400" : "text-emerald-400"}`}
            >
              Top Recommendations for{" "}
              {side.name.length > 20
                ? side.name.slice(0, 20) + "..."
                : side.name}
            </h3>
            <div className="space-y-2">
              {side.data.recommendations.slice(0, 3).map((rec, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 items-start ${si === 0 ? "bg-indigo-500/[0.03] border-indigo-500/[0.06]" : "bg-emerald-500/[0.03] border-emerald-500/[0.06]"} border rounded-lg p-3`}
                >
                  <span
                    className={`flex-shrink-0 w-5 h-5 rounded-md ${si === 0 ? "bg-indigo-500/10 text-indigo-400" : "bg-emerald-500/10 text-emerald-400"} flex items-center justify-center text-[10px] font-bold mt-0.5`}
                  >
                    {i + 1}
                  </span>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {rec}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
