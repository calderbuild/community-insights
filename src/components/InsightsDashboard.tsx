"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  TrendingUp,
  Lightbulb,
  Users,
  Target,
  Activity,
  MessageSquare,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Download,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const CHART_COLORS = [
  "#818cf8",
  "#22d3ee",
  "#a78bfa",
  "#34d399",
  "#f472b6",
  "#38bdf8",
  "#fbbf24",
  "#fb923c",
];

const SENTIMENT_COLORS = {
  positive: "#34d399",
  neutral: "#fbbf24",
  negative: "#f87171",
};

const tooltipStyle = {
  backgroundColor: "rgba(8, 12, 24, 0.95)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  color: "#f1f5f9",
  boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
  backdropFilter: "blur(12px)",
};

function scoreColor(score: number): string {
  if (score >= 70) return "#34d399";
  if (score >= 40) return "#fbbf24";
  return "#f87171";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Work";
}

export default function InsightsDashboard({
  data,
}: {
  data: AnalysisResult;
}) {
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const sentimentData = [
    { name: "Positive", value: data.sentiment.positive },
    { name: "Neutral", value: data.sentiment.neutral },
    { name: "Negative", value: data.sentiment.negative },
  ];

  const topicChartData = data.topTopics.map((t) => ({
    name: t.topic.length > 18 ? t.topic.slice(0, 18) + "..." : t.topic,
    fullName: t.topic,
    count: t.count,
    growth: t.growth,
  }));

  const maxCount = data.topTopics.length
    ? Math.max(...data.topTopics.map((t) => t.count))
    : 100;
  const radarData = data.topTopics.slice(0, 6).map((t) => ({
    topic: t.topic.length > 12 ? t.topic.slice(0, 12) + "..." : t.topic,
    engagement: Math.round((t.count / maxCount) * 100),
    growth: Math.max(0, t.growth),
  }));

  const healthScore = data.healthScore;
  const healthDimensions = [
    { label: "Content Quality", value: healthScore.contentQuality },
    { label: "Engagement", value: healthScore.engagement },
    { label: "Growth", value: healthScore.growth },
    { label: "Leadership", value: healthScore.leadership },
    { label: "Positivity", value: healthScore.positivity },
  ];

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.1] rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md shadow-black/10"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Stats Overview */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up"
        style={{ animationDelay: "0ms" }}
      >
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          label="Health Score"
          value={`${healthScore.overall}`}
          suffix="/100"
          glowClass="stat-glow-indigo"
          iconColor="text-indigo-400"
        />
        <StatCard
          icon={<MessageSquare className="w-5 h-5" />}
          label="Total Posts"
          value={data.totalPosts.toLocaleString()}
          glowClass="stat-glow-purple"
          iconColor="text-purple-400"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Active Members"
          value={data.activeMembersCount.toLocaleString()}
          glowClass="stat-glow-blue"
          iconColor="text-cyan-400"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Topics Tracked"
          value={data.topTopics.length.toString()}
          glowClass="stat-glow-emerald"
          iconColor="text-emerald-400"
        />
      </div>

      {/* Health Score Gauge */}
      <div
        className="glass-card rounded-2xl p-6 animate-fade-in-up"
        style={{ animationDelay: "60ms" }}
      >
        <SectionHeader
          icon={<Activity className="w-5 h-5 text-indigo-400" />}
          title="Community Health Score"
        />
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* SVG Circular Gauge */}
          <div className="relative flex-shrink-0">
            {/* Outer glow ring */}
            <div
              className="absolute inset-0 rounded-full gauge-glow"
              style={{
                background: `radial-gradient(circle, ${scoreColor(healthScore.overall)}15 0%, transparent 70%)`,
              }}
            />
            <svg width="180" height="180" viewBox="0 0 180 180">
              <defs>
                <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="50%" stopColor={scoreColor(healthScore.overall)} />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              {/* Background circle */}
              <circle
                cx="90"
                cy="90"
                r="75"
                fill="none"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="12"
              />
              {/* Tick marks */}
              <circle
                cx="90"
                cy="90"
                r="75"
                fill="none"
                stroke="rgba(255,255,255,0.015)"
                strokeWidth="12"
                strokeDasharray="2 21"
                transform="rotate(-90 90 90)"
              />
              {/* Score arc */}
              <circle
                cx="90"
                cy="90"
                r="75"
                fill="none"
                stroke="url(#gaugeGrad)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(healthScore.overall / 100) * 471} 471`}
                strokeDashoffset="0"
                transform="rotate(-90 90 90)"
                className="health-gauge-fill"
                style={{
                  filter: `drop-shadow(0 0 10px ${scoreColor(healthScore.overall)}40)`,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-white tracking-tight">
                {healthScore.overall}
              </span>
              <span className="text-[11px] text-gray-400 mt-0.5 uppercase tracking-wider">
                {scoreLabel(healthScore.overall)}
              </span>
            </div>
          </div>

          {/* Sub-dimensions */}
          <div className="flex-1 w-full space-y-3">
            {healthDimensions.map((dim) => (
              <div key={dim.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-400">{dim.label}</span>
                  <span
                    className="font-medium"
                    style={{ color: scoreColor(dim.value) }}
                  >
                    {dim.value}
                  </span>
                </div>
                <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full health-bar-fill"
                    style={{
                      width: `${dim.value}%`,
                      backgroundColor: scoreColor(dim.value),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div
        className="glass-card rounded-2xl p-6 animate-fade-in-up"
        style={{ animationDelay: "120ms" }}
      >
        <SectionHeader
          icon={<BarChart3 className="w-5 h-5 text-indigo-400" />}
          title="Executive Summary"
        />
        <p className="text-gray-300 leading-relaxed text-[15px]">
          {data.summary}
        </p>
      </div>

      {/* Charts Row */}
      <div
        className="grid md:grid-cols-5 gap-6 animate-fade-in-up"
        style={{ animationDelay: "180ms" }}
      >
        {/* Topic Distribution */}
        <div className="glass-card rounded-2xl p-6 md:col-span-3">
          <SectionHeader
            icon={<BarChart3 className="w-5 h-5 text-indigo-400" />}
            title="Topic Distribution"
          />
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={topicChartData} layout="vertical" barSize={20}>
              <XAxis
                type="number"
                stroke="#374151"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#6b7280"
                fontSize={11}
                width={130}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "rgba(99, 102, 241, 0.06)" }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {topicChartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sentiment Analysis */}
        <div className="glass-card rounded-2xl p-6 md:col-span-2">
          <SectionHeader
            icon={<Activity className="w-5 h-5 text-emerald-400" />}
            title="Sentiment"
          />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={SENTIMENT_COLORS.positive} />
                <Cell fill={SENTIMENT_COLORS.neutral} />
                <Cell fill={SENTIMENT_COLORS.negative} />
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-5 mt-2">
            {sentimentData.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: Object.values(SENTIMENT_COLORS)[i],
                  }}
                />
                <span className="text-xs text-gray-400">
                  {item.name}{" "}
                  <span className="text-gray-300 font-medium">
                    {item.value}%
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Radar Chart + Trending Topics */}
      <div
        className="grid md:grid-cols-5 gap-6 animate-fade-in-up"
        style={{ animationDelay: "240ms" }}
      >
        {/* Radar */}
        <div className="glass-card rounded-2xl p-6 md:col-span-2">
          <SectionHeader
            icon={<Zap className="w-5 h-5 text-amber-400" />}
            title="Topic Radar"
          />
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis
                dataKey="topic"
                tick={{ fill: "#9ca3af", fontSize: 11 }}
              />
              <PolarRadiusAxis
                tick={false}
                axisLine={false}
                domain={[0, 100]}
              />
              <Radar
                name="Engagement"
                dataKey="engagement"
                stroke="#22d3ee"
                fill="#22d3ee"
                fillOpacity={0.12}
                strokeWidth={2}
              />
              <Radar
                name="Growth"
                dataKey="growth"
                stroke="#34d399"
                fill="#34d399"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Tooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-5 mt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="text-xs text-gray-400">Engagement</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs text-gray-400">Growth</span>
            </div>
          </div>
        </div>

        {/* Trending Topics */}
        <div className="glass-card rounded-2xl p-6 md:col-span-3">
          <SectionHeader
            icon={<TrendingUp className="w-5 h-5 text-indigo-400" />}
            title="Trending Topics"
          />
          <div className="grid sm:grid-cols-2 gap-3">
            {data.topTopics.map((topic, i) => {
              const detail = data.topicDetails?.[topic.topic];
              const isExpanded = expandedTopic === topic.topic;
              const canExpand = !!detail;

              return (
                <div key={i} className="space-y-0">
                  <div
                    onClick={() => {
                      if (canExpand)
                        setExpandedTopic(isExpanded ? null : topic.topic);
                    }}
                    className={`flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] rounded-xl p-4 transition-all ${canExpand ? "cursor-pointer" : "cursor-default"} ${isExpanded ? "rounded-b-none border-b-0" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium text-sm truncate">
                        {topic.topic}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {topic.count} discussions
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                          topic.sentiment === "positive"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : topic.sentiment === "negative"
                              ? "bg-red-500/15 text-red-400"
                              : "bg-amber-500/15 text-amber-400"
                        }`}
                      >
                        {topic.sentiment}
                      </span>
                      <span
                        className={`flex items-center text-xs font-medium ${topic.growth >= 0 ? "text-emerald-400" : "text-red-400"}`}
                      >
                        {topic.growth >= 0 ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {Math.abs(topic.growth)}%
                      </span>
                      {canExpand && (
                        isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                        )
                      )}
                    </div>
                  </div>

                  {/* Topic Drill-down */}
                  {isExpanded && detail && (
                    <div className="bg-white/[0.02] border border-white/[0.04] border-t-0 rounded-b-xl p-4 space-y-3">
                      {/* Trend badge */}
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          detail.trend === "rising"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : detail.trend === "declining"
                              ? "bg-red-500/15 text-red-400"
                              : "bg-gray-500/15 text-gray-400"
                        }`}>
                          {detail.trend}
                        </span>
                        <span className="text-xs text-gray-500">trend</span>
                      </div>

                      {/* Sentiment breakdown mini bar */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">Sentiment breakdown</p>
                        <div className="flex h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full"
                            style={{ width: `${detail.sentimentBreakdown.positive}%`, backgroundColor: SENTIMENT_COLORS.positive }}
                          />
                          <div
                            className="h-full"
                            style={{ width: `${detail.sentimentBreakdown.neutral}%`, backgroundColor: SENTIMENT_COLORS.neutral }}
                          />
                          <div
                            className="h-full"
                            style={{ width: `${detail.sentimentBreakdown.negative}%`, backgroundColor: SENTIMENT_COLORS.negative }}
                          />
                        </div>
                      </div>

                      {/* Key quotes */}
                      {detail.keyQuotes.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1.5">Key quotes</p>
                          <div className="space-y-1.5">
                            {detail.keyQuotes.slice(0, 3).map((q, qi) => (
                              <p key={qi} className="text-xs text-gray-400 italic border-l-2 border-indigo-500/30 pl-2">
                                &ldquo;{q}&rdquo;
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Related posts */}
                      {detail.relatedPosts.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1.5">Related posts</p>
                          <div className="space-y-1">
                            {detail.relatedPosts.slice(0, 3).map((p, pi) => (
                              <p key={pi} className="text-xs text-gray-400">
                                {p}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div
        className="glass-card rounded-2xl p-6 animate-fade-in-up"
        style={{ animationDelay: "300ms" }}
      >
        <SectionHeader
          icon={<Lightbulb className="w-5 h-5 text-amber-400" />}
          title="Key Insights"
        />
        <div className="space-y-3">
          {data.keyInsights.map((insight, i) => (
            <div key={i} className="flex gap-3.5 items-start group">
              <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs font-bold mt-0.5">
                {i + 1}
              </span>
              <p className="text-gray-300 text-[15px] leading-relaxed">
                {insight}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Member Highlights */}
      <div
        className="glass-card rounded-2xl p-6 animate-fade-in-up"
        style={{ animationDelay: "360ms" }}
      >
        <SectionHeader
          icon={<Users className="w-5 h-5 text-blue-400" />}
          title="Member Highlights"
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.memberHighlights.map((member, i) => (
            <div
              key={i}
              className="bg-white/[0.03] border border-white/[0.04] hover:border-indigo-500/20 rounded-xl p-4 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                  style={{
                    background: `linear-gradient(135deg, ${CHART_COLORS[i % CHART_COLORS.length]}, ${CHART_COLORS[(i + 1) % CHART_COLORS.length]})`,
                  }}
                >
                  {member.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {member.name}
                  </p>
                  <p className="text-xs text-gray-500">{member.posts} posts</p>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-500">Engagement</span>
                  <span className="text-white font-medium">
                    {member.engagement}%
                  </span>
                </div>
                <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full health-bar-fill"
                    style={{
                      width: `${member.engagement}%`,
                      background: `linear-gradient(90deg, ${CHART_COLORS[i % CHART_COLORS.length]}, ${CHART_COLORS[(i + 1) % CHART_COLORS.length]})`,
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {member.topTopics.map((topic, j) => (
                  <span
                    key={j}
                    className="px-2 py-0.5 bg-white/[0.04] text-gray-400 rounded-md text-[10px] font-medium"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div
        className="glass-card rounded-2xl p-6 animate-fade-in-up"
        style={{ animationDelay: "420ms" }}
      >
        <SectionHeader
          icon={<Target className="w-5 h-5 text-emerald-400" />}
          title="Actionable Recommendations"
        />
        <div className="space-y-3">
          {data.recommendations.map((rec, i) => (
            <div
              key={i}
              className="flex gap-3.5 items-start bg-emerald-500/[0.03] border border-emerald-500/[0.06] rounded-xl p-4"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold mt-0.5">
                {i + 1}
              </span>
              <p className="text-gray-300 text-[15px] leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Growth Playbook */}
      {data.growthPlaybook && data.growthPlaybook.length > 0 && (
        <div
          className="glass-card rounded-2xl p-6 animate-fade-in-up"
          style={{ animationDelay: "480ms" }}
        >
          <SectionHeader
            icon={<Calendar className="w-5 h-5 text-purple-400" />}
            title="30-Day Growth Playbook"
          />
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-6 bottom-6 w-px bg-gradient-to-b from-indigo-500/40 via-purple-500/40 to-emerald-500/40 print:bg-gray-300" />

            <div className="space-y-6">
              {data.growthPlaybook.map((week, i) => {
                const weekColors = [
                  { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
                  { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
                  { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
                  { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
                ];
                const color = weekColors[i % weekColors.length];

                return (
                  <div key={i} className="relative pl-12">
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-2.5 top-1 w-5 h-5 rounded-full ${color.bg} border-2 ${color.border} flex items-center justify-center`}
                    >
                      <span className={`text-[9px] font-bold ${color.text}`}>
                        {week.week}
                      </span>
                    </div>

                    <div className={`border ${color.border} rounded-xl p-4 bg-white/[0.01]`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium text-sm">
                          Week {week.week}: {week.theme}
                        </h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${color.bg} ${color.text} font-medium`}>
                          {week.expectedImpact}
                        </span>
                      </div>
                      <ul className="space-y-1.5">
                        {week.actions.map((action, j) => (
                          <li
                            key={j}
                            className="flex items-start gap-2 text-sm text-gray-400"
                          >
                            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${color.bg.replace("/10", "/40")}`} />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
      {icon}
      {title}
    </h3>
  );
}

function StatCard({
  icon,
  label,
  value,
  suffix,
  glowClass,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
  glowClass: string;
  iconColor: string;
}) {
  return (
    <div className={`glass-card rounded-2xl p-5 ${glowClass}`}>
      <div className={`${iconColor} mb-2`}>{icon}</div>
      <p className="text-2xl font-bold text-white tracking-tight">
        {value}
        {suffix && (
          <span className="text-sm font-normal text-gray-500">{suffix}</span>
        )}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
