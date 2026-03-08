---
title: "feat: Upgrade Scraping, Manual Input, and Data Transparency"
type: feat
date: 2026-03-08
deepened: 2026-03-08
---

# Upgrade Scraping, Manual Input, and Data Transparency

## Enhancement Summary

**Deepened on:** 2026-03-08
**Sections enhanced:** 7
**Research agents used:** architecture-strategist, performance-oracle, security-sentinel, spec-flow-analyzer, Playwright docs (Context7), Skool scraping research, Vercel React best practices

### Key Improvements
1. **Phase 1 方案调整**: Playwright 在 Vercel Hobby 10s 超时下不可用，改为探索 Skool `_next/data` JSON API 作为主路径，Playwright 仅作为本地/Pro plan 备选
2. **安全修复前置**: URL 验证存在 SSRF 漏洞（substring check 可绕过），必须在任何抓取改进之前修复
3. **dataConfidence 确定性计算**: 不让 AI 自评置信度，改为根据 dataQuality 元数据确定性计算
4. **性能关键发现**: analyze route 的 AI 调用 15-30s 也会超时，需要考虑 streaming 或拆分请求
5. **已有 bug 需先修**: CSV 解析器不处理引号字段、comparison mode 渲染 bug、URL2 无校验

### New Considerations Discovered
- Skool 是 Next.js 应用，有 `_next/data/{buildId}/path.json` 端点可直接获取结构化数据
- 存在第三方 SkoolAPI (docs.skoolapi.com) 非官方 API 包装
- 当前 scrape route 的两次 fetch 是串行的，并行化可减少 5s 延迟
- `lucide-react` 和 `recharts` 的 barrel imports 拖慢构建，需要 `optimizePackageImports`

---

## Overview

Skool hackathon 提交后收到的核心反馈：dashboard 好看，但数据不准。根本原因是 Skool 是 SPA，Cheerio 只能拿到 meta tags，posts 数组几乎永远为空。AI 分析实际上是基于社区名称和描述的推测，不是真实数据。

三个方向同时推进：
1. **Headless 浏览器抓取** -- 拿到真实 post 数据
2. **增强手动输入** -- private community 的解决方案
3. **数据透明度** -- 让用户知道哪些是真实数据、哪些是推测

## Problem Statement

| 问题 | 影响 | 来源 |
|------|------|------|
| Cheerio 无法抓取 SPA 渲染的 posts | 所有社区分析基于推测 | 架构限制 |
| Private community 完全无法分析 | 丢失一半潜在用户 | Alexandru Bogdan 评论 |
| 用户无法判断数据可信度 | 信任危机 | Connor Bk 体验差 |

---

## Phase 0: Pre-requisite Bug Fixes (在三个 Phase 之前)

研究发现当前代码有几个必须先修的问题：

### 0.1 URL 验证 SSRF 漏洞 (Critical)

**当前代码** (`src/app/api/scrape/route.ts:9`):
```typescript
if (!url || !url.includes("skool.com")) {
```

这是 substring check，以下 URL 都能绕过：
- `https://evil.com/skool.com` -- path 包含字符串
- `https://skool.com.evil.com/community` -- subdomain trick
- `http://169.254.169.254/latest/meta-data?skool.com` -- AWS metadata 端点

**修复**: 用 `URL` API 解析后校验 hostname，并从校验后的组件重建 URL：

```typescript
function validateSkoolUrl(input: string): string | null {
  let parsed: URL;
  try { parsed = new URL(input); } catch { return null; }
  if (parsed.protocol !== "https:") return null;
  if (parsed.hostname !== "skool.com" && parsed.hostname !== "www.skool.com") return null;
  const slug = parsed.pathname.match(/^\/([a-zA-Z0-9-]+)/)?.[1];
  if (!slug) return null;
  return `https://www.skool.com/${slug}`;
}
```

### 0.2 CSV 解析器不处理引号字段 (Medium)

**当前代码** (`src/app/page.tsx:84`):
```typescript
const cols = line.split(",").map((c) => c.trim());
```

任何包含逗号的 post 内容都会被错误分割。用 `papaparse` (7KB gzipped) 替换。

### 0.3 Comparison mode 渲染 bug (Medium)

`page.tsx:599-609` -- 如果 Community A 失败但 Community B 成功，`analysis` 为 null，`analysis2` 有数据，但 dashboard 不渲染。需要处理只有 `analysis2` 的情况。

### 0.4 Comparison mode URL2 无校验 (Low)

第二个 URL 输入框没有 skool.com 校验，可以输入任意 URL。

### 0.5 API 错误信息泄露 (Low)

`src/lib/ai.ts:54` -- `reject(new Error(`API ${res.statusCode}: ${data.slice(0, 200)}`))` 可能泄露 API key 或内部信息。改为通用错误消息。

**文件变更**:

| 文件 | 变更 |
|------|------|
| `src/app/api/scrape/route.ts` | 替换 URL 校验逻辑 |
| `src/app/page.tsx` | 修复 CSV 解析、comparison 渲染 bug、URL2 校验 |
| `src/lib/ai.ts` | 错误消息泛化 |
| `package.json` | 添加 `papaparse` |

---

## Phase 1: Headless Browser Scraping (方案修订)

### Research Insights

**核心发现：Playwright 在 Vercel Hobby 是 dead on arrival。**

Architecture review 和 Performance review 一致指出：
- Chromium 二进制解压 3-8s + 浏览器启动 1-2s + 页面导航渲染 2-5s = **6-15s 仅浏览器部分**
- Vercel Hobby 10s 超时 = Playwright 路径几乎永远超时
- 添加 ~50MB 依赖只为一个不会工作的代码路径，违反 "是否有更简单的方法？" 原则

**替代方案发现：Skool 是 Next.js 应用**

研究发现 Skool 基于 Next.js 构建。这意味着存在 `_next/data/{buildId}/{path}.json` 端点，返回页面 props 的结构化 JSON。已有第三方 scraper ([Cristian Tala on Apify](https://apify.com/cristiantala/skool-community-scraper/api)) 利用此端点，声称比浏览器方案快 10 倍。

### 修订方案：三级抓取策略

**Level 1: `_next/data` JSON API (优先)**
- 从 Skool 页面 HTML 中提取 `buildId`（在 `<script>` 标签中）
- 构造 `_next/data/{buildId}/{slug}.json` 请求
- 直接获取结构化 JSON 数据，无需浏览器
- 零额外依赖，适用于任何 Vercel plan
- 风险：buildId 会变化，Skool 可能阻止未认证请求

**Level 2: Cheerio 增强 (Fallback)**
- 保留现有 Cheerio 方案
- 并行化两次 fetch (`Promise.allSettled`)
- 降低超时到 4s/4s（meta tags 在快速响应中就有）

**Level 3: Playwright (仅 Pro plan / 本地开发)**
- 仅在 `maxDuration >= 30` 的环境中启用
- 运行时检测：`process.env.VERCEL_FUNCTION_MAX_DURATION`
- 不作为默认路径

**文件变更**:

| 文件 | 变更 |
|------|------|
| `package.json` | 添加 `playwright-core`, `@sparticuz/chromium-min` (可选依赖) |
| `next.config.ts` | 添加 `serverExternalPackages` + `optimizePackageImports` |
| `src/app/api/scrape/route.ts` | 重写：_next/data 优先 -> Cheerio fallback -> Playwright (条件) |
| `src/lib/scraper.ts` (新建) | 抽取三级抓取逻辑，统一 `Scraper` 接口 |

### Scraper 接口设计

```typescript
interface Scraper {
  scrape(url: string): Promise<ScrapeResult>;
}

// Route handler 选择策略，不用 try/catch 级联
function pickScraper(env: string): Scraper {
  if (env === 'local' || maxDuration >= 30) return new PlaywrightScraper();
  return new NextDataScraper(new CheerioScraper()); // NextData 带 Cheerio fallback
}
```

### Playwright 安全配置 (如果使用)

```typescript
const context = await browser.newContext({
  javaScriptEnabled: true,
  permissions: [],
});
const page = await context.newPage();

// 只允许 skool.com 请求，阻止图片/字体/样式
await page.route('**/*', (route) => {
  const type = route.request().resourceType();
  if (['image', 'media', 'font', 'stylesheet'].includes(type)) return route.abort();
  const url = new URL(route.request().url());
  if (url.hostname !== 'www.skool.com' && url.hostname !== 'skool.com') return route.abort();
  return route.continue();
});

page.setDefaultNavigationTimeout(15000);
```

### Edge Cases
- `buildId` 变化 -> fallback to Cheerio
- `_next/data` 返回 404 或认证要求 -> fallback to Cheerio
- Playwright OOM (比较模式两个实例) -> 串行化请求，不并行启动

---

## Phase 2: Enhanced Manual Input

**目标**: 让 private community 的管理员能轻松导入数据进行分析。

**改进点**:

1. **结构化粘贴指引** -- 在 textarea 旁添加说明，告诉用户如何从 Skool 复制 posts
2. **智能解析** -- textarea 支持自由格式文本，AI prompt 增加解析指令
3. **CSV 模板下载** -- 提供预填表头的 CSV 模板，用户填入数据后上传
4. **Private community 检测** -- 如果 scraping 返回极少数据，主动提示用户手动输入
5. **社区命名** -- manual-input-only 模式下提供 "Community Name" 输入框（不再显示 "Community Analysis"）

### Research Insights

**Private community 检测方法**:
Skool 对 private community 返回 200 + login 页面，不是 HTTP 401/403。检测方式：检查 HTML 内容是否包含登录表单标记（如 `<form` + `password` 或 Skool 特定的登录 UI 标记）。

**Prompt injection 风险**:
Manual input 直接拼接到 LLM prompt 中。缓解方案：
- 将用户数据放在 `user` message 中，分析指令放在 `system` message 中（结构化分离）
- 服务端限制 manualInput 长度（max 100K 字符）
- AI 响应后验证输出字段合理性

**Comparison mode 手动输入缺失**:
当前有 `manualInput2` state 但没有 UI。比较两个 private community 时用户无法为 Community B 提供数据。需要在比较模式下显示第二个 textarea。

**CSV 解析**: 用 `papaparse` 替换 naive `split(",")` (Phase 0.2)。

**文件变更**:

| 文件 | 变更 |
|------|------|
| `src/app/page.tsx` | paste 指引 UI、CSV 模板按钮、private community 提示、Community Name 输入、comparison mode 第二 textarea |
| `src/app/api/analyze/route.ts` | prompt 结构化分离（system/user messages）、manualInput 长度校验、增强自由文本解析 |
| `src/lib/ai.ts` | 支持 messages 数组（不只是单 prompt 字符串） |
| `public/template.csv` (新建) | CSV 模板文件 |

### Private Community Detection Flow

```
1. 用户输入 URL -> 调用 /api/scrape
2. Scrape route 检查响应 HTML 是否包含登录表单标记
3. 如果检测到 private:
   - dataQuality.source = 'private-detected'
   - 返回 ScrapeResult + private flag
4. 前端收到 private flag:
   - 显示 inline 提示 "This appears to be a private community. Please paste your posts below for analysis."
   - 不中断流程，用户可选择继续（AI 用有限数据推测）或粘贴数据后重新分析
```

---

## Phase 3: Data Transparency

**目标**: dashboard 上显示数据来源和置信度，用户清楚知道哪些是真实数据、哪些是推测。

**实现**:

1. **ScrapeResult 扩展** -- 添加 `dataQuality` 字段:
   ```typescript
   interface ScrapeResult {
     // ...existing fields
     dataQuality?: {
       postsScraped: number;
       manualPostsCount: number;
       hasDescription: boolean;
       hasMemberCount: boolean;
       source: 'nextdata' | 'playwright' | 'cheerio' | 'manual' | 'mixed';
       isPrivate: boolean;
     };
   }
   ```

2. **AnalysisResult 扩展** -- **确定性计算** confidence（不让 AI 自评）:
   ```typescript
   interface AnalysisResult {
     // ...existing fields
     dataConfidence?: 'high' | 'medium' | 'low';
     dataSourceNote?: string;
   }
   ```

3. **Confidence 计算逻辑** -- 在 analyze route 中确定性计算，不依赖 AI:
   ```typescript
   function computeConfidence(quality: DataQuality): { confidence: string; note: string } {
     const totalPosts = quality.postsScraped + quality.manualPostsCount;
     if (totalPosts >= 20) return { confidence: 'high', note: `Based on ${totalPosts} real posts` };
     if (totalPosts >= 5)  return { confidence: 'medium', note: `Based on ${totalPosts} posts + AI estimates` };
     return { confidence: 'low', note: 'AI estimate from community description' };
   }
   ```

4. **Dashboard 显示** -- 在顶部显示数据来源 badge:
   - "Based on 47 real posts" (green badge)
   - "Based on 12 posts + AI estimates" (yellow badge)
   - "AI estimate from community description" (orange badge)

5. **Demo 页面** -- 显示 "Demo data" badge，明确标识为示例数据

### Research Insights

**dataQuality 计算位置问题**:

原计划把 `dataQuality` 放在 `ScrapeResult` 上，但 scrape route 不知道 manual input 的存在（manual input 在 analyze route 才被合并）。

**解决**: `dataQuality` 在两个位置分别计算：
- Scrape route 填写 `postsScraped`, `hasDescription`, `hasMemberCount`, `source`, `isPrivate`
- Analyze route 补充 `manualPostsCount`（根据 manualInput 的行数估算）
- Analyze route 最终调用 `computeConfidence()` 计算 `dataConfidence`

**AI 响应验证**:
当前只校验 `healthScore` 存在性。需要扩展验证 `sentiment`, `topTopics`, `keyInsights`, `totalPosts`, `activeMembersCount` 的存在和类型，所有字段提供 sensible defaults。

**Print/Export**: confidence badge 应该包含在打印输出中，因为它是报告可信度的关键上下文。

**文件变更**:

| 文件 | 变更 |
|------|------|
| `src/lib/types.ts` | 扩展 `ScrapeResult` 和 `AnalysisResult` 类型 |
| `src/app/api/analyze/route.ts` | 确定性计算 confidence、AI 响应验证增强 |
| `src/components/InsightsDashboard.tsx` | 数据来源 badge 组件 |
| `src/lib/demo-data.ts` | 添加 `dataConfidence: 'demo'` 标记 |

---

## Technical Considerations

### Vercel 部署限制

| 限制 | Hobby | Pro |
|------|-------|-----|
| Function size | 250MB | 250MB |
| Timeout (non-streaming) | 10s | 300s |
| Timeout (streaming) | 30s | 300s |
| Memory | 1024MB | 3004MB |

**关键发现**: Vercel Hobby 对 streaming 响应允许 30s（只要数据持续流动）。非 streaming 响应 10s 硬限制。当前 analyze route 的 AI 调用 15-30s 也超时。

**决策**:
- `_next/data` + Cheerio 方案不需要 Playwright，零额外依赖，10s 内可完成
- Playwright 仅作为可选路径（Pro plan / 本地）
- AI 分析路径需要评估是否改为 streaming

### 性能优化 (并入实现)

| 优化 | 优先级 | 文件 | 效果 |
|------|--------|------|------|
| 并行化 scrape 的两次 fetch | CRITICAL | `scrape/route.ts` | 减少 ~5s |
| `optimizePackageImports: ['lucide-react', 'recharts']` | CRITICAL | `next.config.ts` | 构建速度 + bundle size |
| 预加载 dashboard chunk（用户点 Analyze 时开始） | CRITICAL | `page.tsx` | 数据到达时立即渲染 |
| 降低 scrape 超时到 4s/4s | HIGH | `scrape/route.ts` | 适配 10s function 限制 |
| Hoist static JSX arrays (features grid, example URLs) | MEDIUM | `page.tsx` | 减少重复渲染 |
| 请求体大小限制 (512KB) | MEDIUM | `scrape/route.ts`, `analyze/route.ts` | 防止 abuse |
| 基础 IP 限流 | MEDIUM | API routes | 防止 API credit 消耗 |

### 向后兼容

- `ScrapeResult` 和 `AnalysisResult` 新增字段都是 optional (`?`)，不影响 demo 数据
- Cheerio 保留为 fallback，任何时候新方案失败都不影响基本功能
- 新增的 `papaparse` 依赖只在客户端使用，不影响 API routes

### 安全修复 (并入实现)

| 修复 | 严重度 | 文件 |
|------|--------|------|
| URL 验证用 `new URL()` 替换 `includes()` | Critical | `scrape/route.ts` |
| Prompt 结构化分离 (system/user messages) | High | `analyze/route.ts`, `ai.ts` |
| Playwright 网络沙箱（只允许 skool.com） | High | `scraper.ts` |
| API 错误消息泛化 | Low | `ai.ts` |
| 请求体大小限制 | Medium | API routes |
| manualInput 长度限制 (100K chars) | Medium | `analyze/route.ts` |

---

## Acceptance Criteria

### Phase 0: Bug Fixes
- [x] URL 验证用 `new URL()` 解析 + hostname 校验 + URL 重建
- [x] CSV 解析用 `papaparse` 处理引号字段
- [x] Comparison mode: Community A 失败 + B 成功时正确渲染
- [x] URL2 输入框有 skool.com 校验
- [x] API 错误消息不泄露内部信息

### Phase 3: Data Transparency (先于 Phase 2)
- [x] `ScrapeResult` 包含 optional `dataQuality` 字段
- [x] `AnalysisResult` 包含 optional `dataConfidence` 和 `dataSourceNote`
- [x] `dataConfidence` 由 analyze route 确定性计算（不依赖 AI）
- [x] Dashboard 顶部显示数据来源 badge（green/yellow/orange）
- [x] Demo 页面显示 "Demo data" badge
- [x] Print 输出包含 confidence badge
- [x] AI 响应验证扩展到所有核心字段

### Phase 2: Manual Input
- [x] Textarea 旁显示结构化粘贴指引
- [x] 提供 CSV 模板下载（处理引号的正确格式）
- [x] Scrape 返回 `isPrivate: true` 时显示 inline 提示
- [x] Manual-input-only 模式有 Community Name 输入框
- [x] Comparison mode 有第二个 textarea
- [x] Prompt 结构化分离（system/user messages）
- [x] manualInput 服务端长度限制 (100K)

### Phase 1: Headless Scraping
- [x] `_next/data` JSON API 路径实现（提取 buildId + 构造请求）
- [x] `_next/data` 失败时 fallback 到 Cheerio
- [x] Scrape 两次 fetch 并行化
- [ ] (可选) Playwright 路径在 Pro plan / 本地可用
- [x] Scraper 接口统一，route handler 不含 try/catch 级联
- [x] 本地 `npm run build` 通过

---

## Success Metrics

- 公开社区分析从 0 条 real posts 提升到 10-30+ 条（via `_next/data`）
- 用户能在 dashboard 上明确看到数据来源和置信度
- Private community 用户有清晰的手动输入路径和提示
- URL 验证无法被绕过（安全测试）

## Dependencies & Risks

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| Vercel Hobby 10s 超时 | 高 | Playwright 路径不可用 | `_next/data` 不需要 Playwright |
| `_next/data` 端点被 Skool 认证保护 | 中 | Level 1 策略失效 | Fallback to Cheerio + 优化 manual input |
| `buildId` 频繁变化 | 中 | `_next/data` 请求 404 | 每次请求从 HTML 动态提取 buildId |
| Skool 反爬 / rate limit | 中 | 被封 IP | 单次请求，合理 User-Agent |
| AI 分析 15-30s 也超 Hobby 限制 | 高 | analyze route 504 | 需评估 streaming 方案（允许 30s） |
| `papaparse` 增加客户端 bundle | 低 | +7KB gzipped | 可接受 |

## Implementation Order

1. **Phase 0** (Bug Fixes) -- 安全和正确性前置，1-2 小时
2. **Phase 3** (Data Transparency) -- 建立 dataQuality 数据结构，2-3 小时
3. **Phase 2** (Manual Input) -- 依赖 Phase 3 的 dataQuality 做 private detection，3-4 小时
4. **Phase 1** (Headless Scraping) -- 最复杂最高风险放最后，4-6 小时

先做确定能交付的，再做有风险的。

## References

- [Vercel KB -- Deploying Puppeteer](https://vercel.com/kb/guide/deploying-puppeteer-with-nextjs-on-vercel)
- [GitHub -- @sparticuz/chromium](https://github.com/Sparticuz/chromium)
- [Apify -- Skool Community Scraper](https://apify.com/cristiantala/skool-community-scraper/api) -- 使用 `_next/data` 端点
- [SkoolAPI (非官方)](https://docs.skoolapi.com/) -- 第三方 API 包装
- [Playwright route interception docs](https://github.com/microsoft/playwright/blob/main/docs/src/network.md)
- Current scraping: `src/app/api/scrape/route.ts`
- Current analysis: `src/app/api/analyze/route.ts`
- Types: `src/lib/types.ts`
- Dashboard: `src/components/InsightsDashboard.tsx`
