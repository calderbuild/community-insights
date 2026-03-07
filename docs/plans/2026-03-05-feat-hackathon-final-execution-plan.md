---
title: "feat: Hackathon Grand Prize - Final Execution Plan"
type: feat
date: 2026-03-05
---

# Hackathon 冲奖终极执行计划

## 核心判断

评审四维度：**能跑 > 有用 > 清晰 > 有亮点**。

外部建议中的 Supabase、Auth0、Redis、Sentry、SEO、多平台支持、Cypress 测试等全部排除。Hackathon 评委看的是 2 分钟 Demo，不是产品路线图。每一个小时都必须花在 Demo 中**看得见**的改进上。

## 当前已达标

- 线上部署：https://community-insights-virid.vercel.app
- 端到端流程：URL -> scrape -> AI 分析 -> Dashboard
- 可视化：BarChart、PieChart、RadarChart、统计卡片
- 暗色主题 + Glassmorphism + 入场动画
- 错误处理 + 优雅降级（scrape 失败仍可分析）

## 需要补的 6 件事（按执行顺序）

### 1. 数据输入增强（30min）

**问题**：Skool CSR 导致 scrape 只拿到 meta tags，AI 在"猜"不是在"分析"。
**这是最影响"有用"维度的短板。**

改动：
- [ ] `src/app/page.tsx`: textarea 从隐藏改为**始终可见**，放在 URL 输入框下方
- [ ] 引导文字改为："Paste community posts here for deeper analysis (try the example below)"
- [ ] 加一个 "Load Example Data" 按钮，预填 15-20 条真实 hackathon 社群帖子
- [ ] `src/app/api/analyze/route.ts`: prompt 中明确标注粘贴数据是真实帖子

验收：有粘贴数据时，AI 分析结果中出现具体帖子引用、具体成员名、具体话题趋势。

### 2. Community Health Score 仪表盘（45min）

**问题**：当前 "84/100" 纯文字没有视觉冲击力。

改动：
- [ ] `src/lib/types.ts`: AnalysisResult 添加 `healthScore` 对象，含 5 个子维度分数
- [ ] `src/app/api/analyze/route.ts`: prompt 中要求 AI 返回 `healthScore`
- [ ] `src/components/InsightsDashboard.tsx`: 在 stat cards 和 summary 之间加 Health Score 区域
  - 中央大号 SVG 圆环 gauge（CSS 动画从 0 填充到目标值）
  - 下方 5 个小进度条：Content Quality、Engagement、Growth、Leadership、Positivity
  - 每个带颜色标识（green/yellow/red 按分数区间）

验收：Dashboard 打开时 gauge 有动画填充效果，评委 3 秒内理解社群状态。

### 3. Demo 预加载页面（20min）

**问题**：真实分析要 15-20 秒，Demo 时评委会走神。

改动：
- [ ] `src/lib/demo-data.ts`: 用一次真实分析结果保存为 JSON 常量
- [ ] `src/app/demo/page.tsx`: 直接渲染 InsightsDashboard + demo 数据，零等待
- [ ] `src/app/page.tsx`: Hero 区加 "See Demo" 按钮跳转 `/demo`

验收：`/demo` 页面瞬间加载完整 Dashboard。

### 4. 导出 PDF（15min）

**问题**：分析结果无法分享。Demo 中展示"可导出"是加分项。

改动：
- [ ] `src/components/InsightsDashboard.tsx`: 顶部加 "Export Report" 按钮
- [ ] 按钮调用 `window.print()`
- [ ] `src/app/globals.css`: 添加 `@media print` 样式
  - 白色背景、黑色文字
  - 隐藏 header/footer/input/button
  - 图表区域保留颜色
  - 每个 section 避免 page break 截断

验收：点击按钮后 PDF 预览干净可读，图表可见。

### 5. 输入体验优化（10min）

从外部建议中挑出的快速改进：
- [ ] `src/app/page.tsx`: URL 输入框加实时验证（输入后检查是否含 skool.com），无效时 border 变红
- [ ] Loading 状态显示预计时间："Analyzing... usually takes 15-30 seconds"
- [ ] 分析完成后自动 scroll 到结果区域

### 6. OG Meta Tags 完善（5min）

评委可能在 Skool 提交帖里点 live link，OG tags 决定链接预览效果。

改动：
- [ ] `src/app/layout.tsx`: 添加 `og:image`（静态截图）、`og:url`、`twitter:card`

## 不做的事（明确排除）

| 建议 | 排除理由 |
|------|---------|
| 账户系统 / Supabase | Demo 不需要登录 |
| 多平台（Discord/Reddit） | 分散焦点，Skool 专属就是差异化 |
| Redis 缓存 | Hackathon 不存在"重复访问"场景 |
| Sentry / PostHog 监控 | Demo 中看不见 |
| Jest / Cypress 测试 | 评委不看测试覆盖率 |
| Framer Motion | 已有 CSS 动画，不值得引入新依赖 |
| 多模型支持 | 增加复杂度无收益 |
| SEO / Sitemap | 3 天项目不需要 SEO |
| 自定义 AI prompt 编辑 | 过度设计 |

## Demo 视频脚本（2 分钟）

```
0:00-0:08  "Community Insights turns any Skool community into an
           AI-powered analytics dashboard in seconds."
0:08-0:15  展示首页，点击 "See Demo" 按钮
0:15-0:35  /demo 页面：快速滚动 Health Score gauge、Topic Radar、
           Sentiment、Trending Topics、Key Insights
0:35-0:50  回到首页，输入 hackathon URL，点击 Analyze，展示
           真实加载过程（"这是真实 API 调用"）
0:50-1:10  结果出来：重点展示 Health Score 和 Key Insights
1:10-1:30  展示粘贴帖子功能：点 "Load Example Data"，
           再次分析，对比结果更深入
1:30-1:45  点 Export Report，展示 PDF 预览
1:45-1:55  展示线上 live link："评委可以现在就试"
1:55-2:00  "Built by Insight Builders. Powered by Claude AI."
```

## 执行顺序和时间预估

| 序号 | 任务 | 时间 | 累计 |
|------|------|------|------|
| 1 | Health Score gauge 组件 + AI prompt 更新 | 45min | 45min |
| 2 | 数据输入增强 + Example Data | 30min | 1h15m |
| 3 | Demo 预加载页面 | 20min | 1h35m |
| 4 | PDF 导出 | 15min | 1h50m |
| 5 | 输入体验优化 | 10min | 2h |
| 6 | OG Tags | 5min | 2h5m |
| 7 | 最终部署 + 冒烟测试 | 10min | 2h15m |

**总计约 2.5 小时完成所有优化。**

## 提交清单

- [ ] Live link 可访问且稳定
- [ ] /demo 页面正常展示
- [ ] Health Score gauge 有动画效果
- [ ] 粘贴帖子后分析结果更具体
- [ ] PDF 导出可用
- [ ] Demo 视频 < 2 分钟，展示真实运行
- [ ] 提交帖包含：Project Name、Team Name、Team Members、What/Who、Demo video、AI tools used、Live link
