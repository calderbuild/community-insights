---
title: "feat: Hackathon Grand Prize Optimization"
type: feat
date: 2026-03-05
---

# Hackathon 冲奖优化计划

## 背景

评审标准（按权重排序）：
1. **Does it work** - 已达标，线上可运行
2. **Is it useful** - 当前弱项：scrape 数据有限，分析缺少深度
3. **Is it clear** - Demo 还没做，前 30 秒必须让评委看懂
4. **Is it impressive** - 需要视觉冲击力和"这东西真有用"的感觉

Demo 硬约束：2 分钟内，展示真实运行，非幻灯片。

## 目标

让评委在 2 分钟 Demo 内感受到：这是一个**真正有用的、可以立即使用的**社群分析工具，不是套壳 ChatGPT。

## 非目标

- 不做用户注册/登录
- 不做付费功能
- 不做多语言
- 不追求完美的 Skool scraping（CSR 限制无法短期突破）

## 现状分析

| 维度 | 当前状态 | 差距 |
|------|---------|------|
| 数据输入 | URL scrape 只拿到 meta tags | 缺少帖子/评论等深度数据 |
| 分析深度 | AI 基于社区名和描述推测 | 像在猜，不像在分析 |
| 输出形式 | 网页 Dashboard | 无法导出/分享/对比 |
| Demo 吸引力 | 加载等待 + 结果页 | 缺少"惊艳时刻" |
| 差异化 | 通用分析工具 | 没有 Skool 专属价值 |

## 方案：5 个高 ROI 优化

### Phase 1: 数据输入增强（最关键）

**问题**：Skool CSR 导致 scrape 数据极少，AI 在"猜"而不是在"分析"。

**方案**：强化"Additional Context"功能，引导用户粘贴社群内容。

- [ ] 将 textarea 从隐藏的可选项改为**显眼的主要输入方式**
- [ ] 添加引导文字："Paste recent posts from your community for deeper analysis"
- [ ] 提供**一键示例**按钮，预填 demo 数据（hardcoded 真实 hackathon 社群帖子）
- [ ] 在 prompt 中明确告诉 AI 这是用户粘贴的真实帖子数据

**文件**: `src/app/page.tsx`

**验收**: 粘贴 10 条帖子后，AI 分析结果明显比只有 URL 时更具体、更有洞察力。

### Phase 2: 分析结果增强

**问题**：当前输出是静态的统计卡片 + 列表，缺少"哇"的感觉。

**方案 A - 增加"Growth Playbook"板块**：
- [ ] 在 recommendations 后面加一个"30-Day Growth Playbook"区域
- [ ] AI 生成具体的每周行动计划（Week 1/2/3/4）
- [ ] 用时间线视觉组件展示

**方案 B - 增加 Community Health Score 仪表盘**：
- [ ] 用大号圆形仪表（gauge）展示总体健康分
- [ ] 下面列 5 个子维度的小 gauge：内容质量、参与度、增长趋势、领袖活跃度、氛围正向性
- [ ] 比当前的 "84/100" 纯文字更有视觉冲击力

**文件**: `src/components/InsightsDashboard.tsx`, `src/lib/types.ts`, `src/app/api/analyze/route.ts`

**验收**: Dashboard 打开时有明显的视觉焦点，评委 3 秒内理解社群状态。

### Phase 3: 导出 PDF 报告

**问题**: 分析完了只能看网页，无法分享给团队。

**方案**: 添加"Download Report"按钮，用浏览器 print API 生成 PDF。

- [ ] 在 Dashboard 顶部加 "Export PDF" 按钮
- [ ] 点击后调用 `window.print()` 配合 `@media print` 样式
- [ ] Print 样式：白底黑字、隐藏导航、图表保留颜色

**文件**: `src/app/globals.css`（print styles）, `src/components/InsightsDashboard.tsx`（按钮）

**验收**: 点击按钮后弹出打印对话框，PDF 预览干净可读。

### Phase 4: Demo 数据和流程优化

**问题**: Demo 时如果等 AI 返回要 15-20 秒，评委会走神。

**方案**:
- [ ] 准备一份预加载的 demo 数据（hackathon 社群的完整分析结果）
- [ ] 添加 `/demo` 路由，直接渲染预加载数据，零等待
- [ ] 真实 Demo 流程：先展示 `/demo` 的完整结果（5 秒），再做一次真实分析展示"它是实时的"
- [ ] 在首页加 "Watch Demo" 按钮直接跳转 `/demo`

**文件**: `src/app/demo/page.tsx`, `src/lib/demo-data.ts`

**验收**: `/demo` 页面瞬间加载，展示完整 Dashboard。

### Phase 5: Demo 视频录制准备

**问题**: 提交需要 2 分钟内的 Demo 视频。

**方案**: 规划 Demo 脚本：

```
0:00-0:10  开场：一句话说明产品（"Community Insights turns any Skool community URL into an AI-powered analytics dashboard"）
0:10-0:25  展示首页，输入 URL，点击 Analyze
0:25-0:45  等待时展示 loading 动画，结果出来后快速滚动 Dashboard
0:45-1:10  深入展示：Topic Radar、Sentiment、Growth Playbook
1:10-1:25  展示 "Additional Context" 功能：粘贴帖子获得更深分析
1:25-1:40  展示导出 PDF
1:40-1:55  展示线上 live link，评委可以自己试
1:55-2:00  结尾：团队名 + 一句 slogan
```

**验收**: 脚本覆盖所有功能点，节奏紧凑无冷场。

## 优先级排序

| 优先级 | 任务 | 预估工作量 | 对评分影响 |
|--------|------|-----------|-----------|
| P0 | Phase 1: 数据输入增强 | 30min | 直接提升"有用"维度 |
| P0 | Phase 2B: Health Score 仪表盘 | 45min | 视觉冲击力，"有亮点" |
| P1 | Phase 4: Demo 数据预加载 | 30min | Demo 流畅度 |
| P1 | Phase 3: 导出 PDF | 20min | "有用"加分项 |
| P2 | Phase 2A: Growth Playbook | 30min | 差异化 |
| P2 | Phase 5: 录制 Demo | 外部工具 | 最终交付 |

## 风险

| 风险 | 缓解 |
|------|------|
| AI API 不稳定 | 已有 demo 预加载数据兜底 |
| 评委不了解 Skool | Demo 开头用一句话解释 |
| 图表在 PDF 中渲染异常 | 用 `@media print` 简化为纯文本 + 数字 |
| Vercel 冷启动慢 | Demo 前先访问一次预热 |

## 提交清单

- [ ] Live link 可访问且稳定
- [ ] Demo 视频 < 2 分钟
- [ ] 提交帖包含所有必填字段
- [ ] 至少提到 1 个 AI 工具（Claude）
- [ ] 视频展示真实运行，非幻灯片
