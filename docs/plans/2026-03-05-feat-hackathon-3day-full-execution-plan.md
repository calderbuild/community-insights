---
title: "feat: Hackathon 3-Day Full Execution Plan"
type: feat
date: 2026-03-05
---

# Hackathon 3 天完整执行计划

## 核心判断

评审四维度：**能跑 > 有用 > 清晰 > 有亮点**。3 天充足时间，但每个功能必须在 Demo 中**看得见**。功能完成度 > 功能数量。

## 当前已达标

- 线上部署：https://community-insights-virid.vercel.app
- 端到端流程：URL -> scrape -> AI 分析 -> Dashboard
- 可视化：BarChart、PieChart、RadarChart、统计卡片
- 暗色主题 + Glassmorphism + 入场动画
- 错误处理 + 优雅降级（scrape 失败仍可分析）

## 关键设计决策（开工前锁定）

| 决策 | 结论 | 理由 |
|------|------|------|
| healthScore 类型 | `{ overall, contentQuality, engagement, growth, leadership, positivity }` 全部 0-100 | 统一量纲，替代顶层 `engagementScore` |
| "Load Example Data" 是否需要 URL | 不需要，允许纯文本分析 | 避免"填了数据还要填 URL"的困惑 |
| Growth Playbook 生成方式 | 与主分析同一次 AI 调用 | 避免额外 15-20s 等待，`max_tokens` 提高到 8192 |
| 社区对比实现方式 | 两次独立分析 + 前端对比展示 | 复用现有代码，一方失败可优雅降级 |
| 话题钻取实现方式 | AI 返回 `topicPosts` 映射，前端过滤展示 | 无需额外 AI 调用 |
| AI 流式输出 | 降为可选（stretch goal） | 风险最高：触及 ai.ts 全链路 + proxy tunnel 不兼容流式 + InsightsDashboard 不支持 partial data。`/demo` 预加载已解决等待问题 |
| CSV 格式 | 要求 `author,content,likes,comments` 表头，提供模板下载 | 简单明确，与 `CommunityPost` 类型对齐 |
| 对比模式 URL 输入 | 主页加 "Compare" 切换按钮，展开第二个 URL 输入框 | 不影响默认单 URL 体验 |

## 不做的事（明确排除）

| 建议 | 排除理由 |
|------|---------|
| 账户系统 / Supabase | Demo 不需要登录 |
| 多平台（Discord/Reddit） | 分散焦点，Skool 专属是差异化 |
| Redis 缓存 | Hackathon 不存在"重复访问"场景 |
| Sentry / PostHog 监控 | Demo 中看不见 |
| Jest / Cypress 测试 | 评委不看测试覆盖率 |
| Framer Motion | 已有 CSS 动画，不值得引入新依赖 |
| Tremor / shadcn/ui | 已有 Recharts + 自定义 glassmorphism，换组件库是浪费 |
| 多模型支持 | 增加复杂度无收益 |
| SEO / Sitemap | 3 天项目不需要 SEO |
| 自定义 AI prompt 编辑 | 过度设计 |
| Vercel AI SDK 流式输出 | 风险太高（见设计决策），如果前面全部完成且有余量可以尝试 |

---

## Phase 1：核心优化（Day 1 前半，约 3 小时）

这些是原计划中已确认的 6 个任务，必须最先完成。

### 1.1 Community Health Score 仪表盘（45min）

**问题**：当前 "84/100" 纯文字没有视觉冲击力。

**改动文件**：

`src/lib/types.ts`:
- 添加 `HealthScore` 接口：`{ overall: number, contentQuality: number, engagement: number, growth: number, leadership: number, positivity: number }`
- `AnalysisResult` 添加 `healthScore: HealthScore` 字段
- 删除顶层 `engagementScore` 字段（被 `healthScore.engagement` 替代）
- 添加 `growthPlaybook` 字段（Phase 2 用，先定义类型）

`src/app/api/analyze/route.ts`:
- AI prompt 中要求返回 `healthScore` 对象，明确 5 个子维度名和 0-100 范围
- 更新 JSON schema 注释
- `max_tokens` 从 4096 提升至 8192

`src/components/InsightsDashboard.tsx`:
- 在 stat cards 和 summary 之间插入 Health Score 区域
- 中央 SVG 圆环 gauge：纯 CSS/SVG 实现，`stroke-dasharray` + `stroke-dashoffset` 动画从 0 填充到目标值
- 下方 5 个小进度条：Content Quality / Engagement / Growth / Leadership / Positivity
- 每个进度条按分数区间着色：>=70 绿色，40-69 黄色，<40 红色
- 中央显示 overall 数字（大号字体）

**注意**：`InsightsDashboard.tsx:77` 有 `Math.max(...data.topTopics.map(...))` ，空数组会崩溃。加保护：`data.topTopics.length ? Math.max(...) : 100`。

**验收**：Dashboard 打开时 gauge 有动画填充效果，评委 3 秒内理解社群状态。

### 1.2 数据输入增强（30min）

**问题**：Skool CSR 导致 scrape 只拿到 meta tags，AI 在"猜"不是在"分析"。

**改动文件**：

`src/app/page.tsx`:
- textarea 从隐藏（`showManual` toggle）改为**始终可见**，放在 URL 输入框下方
- 删除 `showManual` state 和切换按钮
- 引导文字："Paste community posts here for deeper analysis (or try the example below)"
- 加 "Load Example Data" 按钮，点击后预填 textarea
- **允许无 URL 分析**：`handleAnalyze` 中如果 `manualInput` 有内容但 `url` 为空，跳过 scrape 步骤，直接用 `{ communityName: "Pasted Community", description: "", memberCount: "Unknown", posts: [] }` 作为 scrape 结果
- URL 输入框 placeholder 改为 "Enter Skool community URL (optional if pasting data)"

`src/lib/example-data.ts`（新文件）:
- 导出 `EXAMPLE_POSTS: string` 常量，包含 15-20 条真实风格的 hackathon 社群帖子文本
- 格式：每条帖子一段，包含作者名、内容、模拟互动数据

`src/app/api/analyze/route.ts`:
- prompt 中明确标注粘贴数据是真实帖子："The following are real community posts provided by the community manager"

**验收**：有粘贴数据时，AI 分析结果中出现具体帖子引用、具体成员名、具体话题趋势。无 URL 时也能正常分析。

### 1.3 Demo 预加载页面（20min）

**问题**：真实分析要 15-20 秒，Demo 时评委走神。

**改动文件**：

`src/lib/demo-data.ts`（新文件）:
- 用一次真实分析结果保存为 `DEMO_ANALYSIS: AnalysisResult` JSON 常量
- 包含完整的 healthScore、growthPlaybook（Phase 2 添加后更新）、所有图表数据

`src/app/demo/page.tsx`（新文件）:
- 导入 `InsightsDashboard` 和 `DEMO_ANALYSIS`
- 顶部加返回主页链接："Try with your own community"
- 直接渲染 Dashboard，零等待
- 页面标题 `<title>Demo | Community Insights</title>`

`src/app/page.tsx`:
- Hero 区加 "See Demo" 按钮，`<Link href="/demo">`，与 "Analyze" 按钮并排

**验收**：`/demo` 页面瞬间加载完整 Dashboard。有返回主页的导航。

### 1.4 导出 PDF（30min）

**注意**：时间从原计划 15min 上调至 30min。Recharts 的 `ResponsiveContainer` 在 print media query 切换时可能坍塌。需要迭代测试。

**改动文件**：

`src/components/InsightsDashboard.tsx`:
- 顶部加 "Export Report" 按钮（Download icon）
- 按钮调用 `window.print()`

`src/app/globals.css`:
- 添加 `@media print` 样式块：
  - `body`: 白色背景、黑色文字
  - 隐藏 header、footer、input、button（除了仪表盘内容）
  - `.glass-card`: 去掉 backdrop-filter，白底 + 浅灰边框
  - Recharts 容器：设置固定宽度（避免 ResponsiveContainer 坍塌）
  - SVG gauge：保留颜色
  - `page-break-inside: avoid` 在每个 section
  - 隐藏动画（`animation: none`）

**验收**：点击按钮后 PDF 预览干净可读，图表可见且尺寸正确。

### 1.5 输入体验优化（15min）

**改动文件**：

`src/app/page.tsx`:
- URL 输入框加实时验证：输入后检查是否含 `skool.com`（仅在有输入时检查），无效时 border 变红 + 提示文字
- Loading 状态显示分阶段进度："Scraping community data..." -> "Analyzing with AI..." -> "Generating dashboard..."
- 加载时显示预计时间："Usually takes 15-30 seconds"
- 分析完成后自动 `scrollIntoView({ behavior: 'smooth' })` 到结果区域
- 首页底部加一行 Disclaimer："Data sourced from publicly available pages. For deeper analysis, paste your community posts above."

**验收**：无效 URL 有视觉反馈，加载过程不再是纯 spinner，结果出现后自动滚动。

### 1.6 OG Meta Tags（5min）

**改动文件**：

`src/app/layout.tsx`:
- metadata 对象添加 `openGraph`：`title`, `description`, `url`, `type: 'website'`
- 添加 `twitter`：`card: 'summary_large_image'`
- `og:image` 先用占位值，后续可替换为实际截图

**验收**：在社交平台分享链接时显示正确的标题和描述。

---

## Phase 2：功能扩展（Day 1 后半 + Day 2 前半，约 5 小时）

### 2.1 30-Day Growth Playbook（1.5h）

**价值**：从"分析"升级到"行动"，差异化亮点。评委看到 AI 不只是告诉你问题，还给你每周的具体行动计划。

**改动文件**：

`src/lib/types.ts`:
- 添加 `PlaybookWeek` 接口：`{ week: number, theme: string, actions: string[], expectedImpact: string }`
- `AnalysisResult` 添加 `growthPlaybook: PlaybookWeek[]`（4 个元素，Week 1-4）

`src/app/api/analyze/route.ts`:
- AI prompt 追加：要求返回 `growthPlaybook` 数组，4 周，每周 3-4 个具体行动 + 预期效果
- 示例格式写进 prompt 中确保 AI 输出一致

`src/components/InsightsDashboard.tsx`:
- 在 Recommendations 后面添加 "30-Day Growth Playbook" section
- 时间线布局：左侧竖线 + 4 个节点，每个节点展开为卡片
- 卡片内容：Week N 标题 + theme + action checklist + expected impact 标签
- 配色：使用渐进色（Week 1 浅 -> Week 4 深），表达"递进"感

`src/lib/demo-data.ts`:
- 更新 `DEMO_ANALYSIS` 加入 growthPlaybook 数据

**验收**：Dashboard 底部有完整的 4 周行动计划，时间线视觉清晰，每周行动具体可执行。

### 2.2 CSV 上传模式（1h）

**价值**：多一个数据输入方式，规避 ToS 风险，显得更专业。

**改动文件**：

`src/app/page.tsx`:
- 在 textarea 下方添加文件上传区域："Or upload a CSV file"
- `<input type="file" accept=".csv">` + 拖拽区域样式
- CSV 解析（纯前端，不需要后端）：
  - 读取文件内容（`FileReader`）
  - 按行分割，第一行为表头
  - 验证必须包含 `author` 和 `content` 列（`likes`, `comments` 可选，默认 0）
  - 解析成功后填充到 `manualInput` state（格式化为文本）或直接构造 `CommunityPost[]`
- 错误处理：格式错误时显示具体提示（"Missing 'content' column"、"File too large (max 5MB)"、"Empty file"）
- 提供 "Download CSV Template" 链接

`public/template.csv`（新文件）:
- 包含表头 + 3 行示例数据的模板文件

`src/app/api/analyze/route.ts`:
- 支持接收 `posts: CommunityPost[]` 直接传入（已部分支持，确认逻辑完整）

**验收**：上传符合格式的 CSV 后能正常分析。格式错误有友好提示。模板文件可下载。

### 2.3 社区对比模式（2.5h）

**价值**："对比"是强需求（"我的社区和竞品社区比怎么样？"），视觉冲击力强。

**改动文件**：

`src/app/page.tsx`:
- 在 URL 输入框旁添加 "Compare" 切换按钮
- 切换后展开第二个 URL 输入框 + 第二个 textarea
- "Analyze" 按钮文字变为 "Compare Communities"
- `handleAnalyze` 逻辑分支：
  - 单 URL：现有流程
  - 双 URL：并行发起两次 scrape + 两次 analyze（`Promise.allSettled`）
- 新 state：`compareMode: boolean`, `url2: string`, `manualInput2: string`, `analysis2: AnalysisResult | null`
- 部分失败处理：一方成功一方失败时，显示成功方结果 + 失败方错误卡片

`src/components/ComparisonDashboard.tsx`（新文件）:
- 接收 `{ data1: AnalysisResult, data2: AnalysisResult, name1: string, name2: string }`
- 布局：上方两个 Health Score gauge 并排 + delta 标注（A: 78 vs B: 65, +13）
- 中间：关键指标对比表格（Total Posts / Active Members / Sentiment）
- 下方：话题重叠分析（共同话题 vs 独有话题），用 Venn 风格的列表展示
- 底部：各自的 Top 3 建议并排
- 配色：Community A 用 indigo 系，Community B 用 emerald 系

`src/lib/types.ts`:
- 无需新类型，复用两个 `AnalysisResult`

**部分失败处理**：
- 一方失败：显示成功方的完整 Dashboard + 失败方区域显示错误信息和"Retry"按钮
- 两方都失败：显示错误页面

**验收**：两个社区并排对比，Health Score delta 一目了然，话题重叠清晰展示。一方失败时不崩溃。

---

## Phase 3：高级功能 + 打磨（Day 2 后半 + Day 3，约 5 小时）

### 3.1 交互式话题钻取（2h）

**价值**：Dashboard 从"看"变成"用"，评委可以点击探索。

**改动文件**：

`src/lib/types.ts`:
- `AnalysisResult` 添加 `topicDetails: Record<string, TopicDetail>`
- `TopicDetail` 接口：`{ relatedPosts: string[], sentimentBreakdown: { positive: number, neutral: number, negative: number }, keyQuotes: string[], trend: "rising" | "stable" | "declining" }`

`src/app/api/analyze/route.ts`:
- AI prompt 追加：要求返回 `topicDetails`，为每个 topic 提供相关帖子摘要、情感细分、关键引用、趋势方向
- 仅在有帖子数据时（`manualInput` 或 `posts.length > 0`）才要求此字段

`src/components/InsightsDashboard.tsx`:
- Trending Topics 卡片变为可点击（`cursor-pointer` + hover 效果）
- 点击后在卡片下方展开详情面板（不用 modal，保持上下文）：
  - 情感分布小条形图
  - 趋势方向标签（Rising / Stable / Declining）
  - 相关帖子引用列表（最多 5 条）
  - 关键引用高亮
- 再次点击收起
- 无帖子数据时：卡片不可点击，tooltip 提示 "Paste community posts for drill-down"

**验收**：点击话题卡片展开详情，有情感分布和帖子引用。无数据时不崩溃。

### 3.2 UI 精修 + 动画打磨（1.5h）

**价值**：每个细节的专业度累积产生"这不是 hackathon 项目"的感觉。

**改动文件**：

`src/components/InsightsDashboard.tsx`:
- 所有数字使用 `countUp` 动画（从 0 递增到目标值）
- 进度条使用 CSS transition 而非瞬间填充
- 卡片 hover 效果统一：微妙的 border-glow + translateY(-2px)

`src/app/page.tsx`:
- Hero 区标题增加渐变文字效果（`bg-clip-text text-transparent bg-gradient-to-r`）
- 特性图标使用更精致的 glass-card 容器
- 输入区域整体提升为居中的 glass-card，而非直接铺在背景上

`src/app/globals.css`:
- 添加 `@keyframes countUp` 相关的 CSS
- 微调 glass-card 的 blur 和边框透明度
- 确保所有 hover 效果都有 `transition-all duration-200`

`src/app/layout.tsx`:
- 确认 favicon 是自定义的（不是 Next.js 默认的）

**验收**：整体视觉质感达到 SaaS 产品水平。所有交互元素有反馈，无"死"按钮或"静"数字。

### 3.3 最终部署 + Demo 数据更新 + 冒烟测试（1h）

**改动文件**：

`src/lib/demo-data.ts`:
- 用最终版本的 AI 输出更新 DEMO_ANALYSIS（包含 healthScore、growthPlaybook、topicDetails）
- 确保数据完整性和类型匹配

冒烟测试清单：
- [ ] `/` 首页加载正常
- [ ] `/demo` 瞬间加载完整 Dashboard
- [ ] URL 分析端到端正常（选一个真实 Skool 社区测试）
- [ ] 纯文本分析（无 URL）正常
- [ ] "Load Example Data" 正常
- [ ] CSV 上传正常
- [ ] 对比模式正常（两个 URL）
- [ ] 对比模式单方失败优雅降级
- [ ] PDF 导出正常，图表可见
- [ ] Health Score gauge 动画正常
- [ ] Growth Playbook 展示正常
- [ ] 话题钻取（有数据时）正常
- [ ] 话题钻取（无数据时）不崩溃
- [ ] 移动端基本可用（响应式布局）
- [ ] OG Tags 正确

部署：
- `vercel deploy --prod`
- 验证线上版本与本地一致

### 3.4 Demo 视频录制准备（30min）

不在代码范围内，但需要准备的内容：

Demo 视频脚本（2 分钟）：
```
0:00-0:08  "Community Insights turns any Skool community into an
           AI-powered analytics dashboard in seconds."
0:08-0:15  展示首页，点击 "See Demo" 按钮
0:15-0:30  /demo 页面：快速滚动 Health Score gauge、Topic Radar、
           Sentiment、Growth Playbook
0:30-0:45  回到首页，展示对比模式：输入两个 URL，并排结果
0:45-1:00  展示粘贴帖子功能：点 "Load Example Data"，
           分析，展示更深入的结果 + 话题钻取
1:00-1:15  展示 CSV 上传功能
1:15-1:25  点 Export Report，展示 PDF 预览
1:25-1:40  真实 API 调用：输入 hackathon URL，展示真实加载过程
1:40-1:50  展示线上 live link："评委可以现在就试"
1:50-2:00  "Built by [Team Name]. Powered by Claude AI."
```

---

## Stretch Goal（如果提前完成）

### S1. AI 流式输出（3-4h，高风险）

**前置条件**：Phase 1-3 全部完成且部署稳定后才考虑。

**风险点**：
- `ai.ts` 的 `connectTunnel` 无法支持流式（缓冲整个响应后才解析）
- 本地开发无法测试（只能在 Vercel 上验证）
- `InsightsDashboard` 不支持 partial data（`Math.max(...[])` 会崩溃）
- 改动影响核心数据通路，可能导致已有功能回归

**如果决定做**：
- 仅在 Vercel 部署环境中启用，本地保持 batch 模式
- `ai.ts` 添加 `callAIStream()` 方法，使用 `fetch` + `ReadableStream`
- `/api/analyze` 新建 streaming endpoint（不修改现有 endpoint）
- 前端用 `useEffect` + `EventSource` 监听 SSE
- Dashboard 需要 skeleton 占位 + 逐段填充逻辑

---

## 3 天时间表

| 时段 | 任务 | 时间 | 累计 |
|------|------|------|------|
| **Day 1 上午** | 1.1 Health Score gauge | 45min | 45min |
| | 1.2 数据输入增强 + Example Data | 30min | 1h15m |
| | 1.3 Demo 预加载页面 | 20min | 1h35m |
| | 1.4 PDF 导出 | 30min | 2h05m |
| | 1.5 输入体验优化 | 15min | 2h20m |
| | 1.6 OG Tags | 5min | 2h25m |
| **Day 1 下午** | 2.1 Growth Playbook | 1.5h | 3h55m |
| | 2.2 CSV 上传 | 1h | 4h55m |
| **Day 2 上午** | 2.3 社区对比模式 | 2.5h | 7h25m |
| **Day 2 下午** | 3.1 话题钻取 | 2h | 9h25m |
| | 3.2 UI 精修 | 1.5h | 10h55m |
| **Day 3 上午** | 3.3 最终部署 + 冒烟测试 | 1h | 11h55m |
| | 3.4 Demo 视频准备 | 30min | 12h25m |
| **Day 3 下午** | 缓冲 / Stretch Goal / 录制视频 | -- | -- |

**总计约 12.5 小时，3 天内每天约 4 小时代码工作。** 留有充分缓冲应对意外。

---

## 提交清单

- [ ] Live link 可访问且稳定
- [x] `/demo` 页面正常展示（含 Health Score + Playbook）
- [x] Health Score gauge 有动画效果
- [x] Growth Playbook 4 周计划完整
- [x] 粘贴帖子后分析结果更具体
- [x] CSV 上传可用
- [x] 社区对比模式可用
- [x] 话题钻取可用（有数据时）
- [x] PDF 导出可用
- [ ] Demo 视频 < 2 分钟，展示全部功能
- [ ] 提交帖包含：Project Name、Team Name、Team Members、What/Who、Demo video、AI tools used、Live link

## 关键文件索引

| 文件 | 涉及任务 |
|------|---------|
| `src/lib/types.ts` | 1.1, 2.1, 3.1 |
| `src/app/api/analyze/route.ts` | 1.1, 1.2, 2.1, 2.2, 3.1 |
| `src/components/InsightsDashboard.tsx` | 1.1, 1.4, 2.1, 3.1, 3.2 |
| `src/app/page.tsx` | 1.2, 1.3, 1.5, 2.2, 2.3, 3.2 |
| `src/app/globals.css` | 1.4, 3.2 |
| `src/app/layout.tsx` | 1.6 |
| `src/lib/example-data.ts`（新） | 1.2 |
| `src/lib/demo-data.ts`（新） | 1.3, 3.3 |
| `src/app/demo/page.tsx`（新） | 1.3 |
| `src/components/ComparisonDashboard.tsx`（新） | 2.3 |
| `public/template.csv`（新） | 2.2 |
