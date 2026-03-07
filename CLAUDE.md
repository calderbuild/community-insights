# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (defaults to port 3000)
npm run build        # Production build
npm run lint         # ESLint
```

Dev server often needs a custom port due to conflicts: `npm run dev -- -p 3333`

## Architecture

Next.js 16 App Router app (React 19, Tailwind CSS 4, TypeScript). Single-page tool that scrapes Skool communities and produces AI-powered analytics dashboards.

### Data Flow

1. User enters Skool URL -> `POST /api/scrape` -> Cheerio extracts meta tags, description, member count from HTML (Skool is client-rendered so post data is limited)
2. Scrape result -> `POST /api/analyze` -> sends community context to AI via OpenAI-compatible chat completions API -> returns structured JSON (`AnalysisResult`)
3. Frontend renders `InsightsDashboard` with Recharts (BarChart, PieChart, RadarChart)

### Key Files

- `src/lib/ai.ts` - AI caller using `child_process.execFileSync` to run `ai-call.js` in a subprocess (bypasses macOS system proxy that intercepts HTTPS from the Next.js process)
- `ai-call.js` - Standalone Node script that makes API calls via HTTP CONNECT tunnel through proxy at `127.0.0.1:7897`, with fallback to direct HTTPS
- `src/lib/types.ts` - Shared TypeScript interfaces: `ScrapeResult`, `AnalysisResult`, `CommunityPost`, `TopicTrend`, `MemberInsight`
- `src/app/api/scrape/route.ts` - Scrapes Skool community pages and /about page
- `src/app/api/analyze/route.ts` - Sends scraped data to AI, parses JSON response
- `src/components/InsightsDashboard.tsx` - Full analytics dashboard with charts, stats, insights
- `src/app/page.tsx` - Main page with URL input, loading states, error handling

### Environment Variables (.env.local)

Uses `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` (not `ANTHROPIC_*` to avoid conflicts with Claude Code's own env vars). The API is OpenAI-compatible format pointing to a relay at `newapi.deepwisdom.ai`。Shell 中的 `ANTHROPIC_BASE_URL=http://perfectapi.arche-tech.ai` 是 Claude Code 系统配置，与项目中转 API 无关。

### Proxy Setup

macOS 外部代理在 `127.0.0.1:7897`，系统级 HTTPS proxy 会拦截 Next.js 进程的所有出站 HTTPS 请求。`ai-call.js` 子进程通过 HTTP CONNECT 隧道连接同一代理，手动建立 TLS 来绕过拦截。

## Design System

Dark theme with glassmorphism cards (`glass-card` CSS class). Color scheme: indigo/purple gradients. Uses Geist font family. Lucide React for icons. Entrance animations via `animate-fade-in-up` CSS class with staggered delays.

## Mistakes Log

| Mistake | Fix |
|---------|-----|
| `.env.local` 用 `ANTHROPIC_*` 前缀导致被 shell 同名变量覆盖 | 项目环境变量用 `AI_*` 前缀，Next.js 不会用 `.env.local` 覆盖已存在的系统环境变量 |
