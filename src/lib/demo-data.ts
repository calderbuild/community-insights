import type { AnalysisResult } from "@/lib/types";

export const DEMO_ANALYSIS: AnalysisResult = {
  summary:
    "The AI Hackathon 2026 community is a highly engaged, action-oriented group of 2,200+ builders. Content quality is strong with members sharing specific results (73% reduction in support tickets, 92% classification accuracy). The dominant themes are AI agent development, prompt engineering, and rapid prototyping. Community leaders actively share toolkits and templates, reducing onboarding friction. Sentiment is overwhelmingly positive with constructive technical discussions.",
  healthScore: {
    overall: 82,
    contentQuality: 85,
    engagement: 79,
    growth: 88,
    leadership: 78,
    positivity: 84,
  },
  topTopics: [
    {
      topic: "AI Agent Development",
      count: 156,
      sentiment: "positive",
      growth: 42,
    },
    {
      topic: "Prompt Engineering",
      count: 134,
      sentiment: "positive",
      growth: 28,
    },
    {
      topic: "Rapid Prototyping",
      count: 112,
      sentiment: "positive",
      growth: 35,
    },
    {
      topic: "Demo & Presentation Tips",
      count: 89,
      sentiment: "positive",
      growth: 55,
    },
    {
      topic: "RAG & Document Processing",
      count: 78,
      sentiment: "neutral",
      growth: 18,
    },
    {
      topic: "Team Formation",
      count: 67,
      sentiment: "positive",
      growth: 12,
    },
    {
      topic: "API Rate Limits & Caching",
      count: 45,
      sentiment: "negative",
      growth: -5,
    },
    {
      topic: "Deployment & DevOps",
      count: 38,
      sentiment: "neutral",
      growth: 8,
    },
  ],
  keyInsights: [
    "Posts with specific metrics (e.g., '73% reduction', '4.5/5 satisfaction') receive 3-5x more engagement than generic updates, suggesting the community values evidence-based sharing.",
    "The 'AI Agent Development' topic has grown 42% in the last week, driven by members shipping customer support bots and code reviewers - indicating a shift from chatbots to autonomous agents.",
    "Community engagement peaks on submission days with members sharing progress updates and demo videos. The average post receives 45 likes and 20 comments.",
    "A knowledge-sharing pattern has emerged: experienced builders create 'toolkit' posts (templates, boilerplate repos) that become reference resources, with Priya Sharma's toolkit post generating 34 likes.",
    "The most common pain point is API rate limiting during hackathon sprints. 15% of help-seeking posts mention timeout or rate limit issues, suggesting a need for caching best practices.",
  ],
  memberHighlights: [
    {
      name: "Jake Thompson",
      posts: 23,
      engagement: 94,
      topTopics: ["AI Strategy", "Community Culture"],
    },
    {
      name: "Rachel Park",
      posts: 18,
      engagement: 89,
      topTopics: ["Growth Tips", "Content Strategy"],
    },
    {
      name: "Emily Watson",
      posts: 15,
      engagement: 86,
      topTopics: ["Full-Stack AI", "Demo Videos"],
    },
    {
      name: "Yuki Tanaka",
      posts: 12,
      engagement: 82,
      topTopics: ["Prompt Engineering", "Classification"],
    },
    {
      name: "Marcus Rodriguez",
      posts: 11,
      engagement: 78,
      topTopics: ["RAG", "Document Processing"],
    },
  ],
  recommendations: [
    "Create a pinned 'Caching & Rate Limit Solutions' thread - 15% of members hit this pain point. Include Redis/Upstash setup guides and request batching patterns.",
    "Launch a weekly 'Show & Tell' thread where builders share 60-second demo clips. Posts with video already get 2x more engagement than text-only.",
    "Establish a 'Toolkit Library' section curating the best template repos, boilerplate code, and setup guides shared by members like Priya Sharma.",
    "Encourage posts with specific metrics by creating a 'Impact Report' template: problem, solution, measurable result. This format consistently drives the highest engagement.",
    "Pair experienced builders (Jake, Rachel) with newcomers through a mentorship matching thread. 23% of team formation posts go unanswered.",
  ],
  sentiment: {
    positive: 68,
    neutral: 24,
    negative: 8,
  },
  totalPosts: 847,
  activeMembersCount: 342,
  growthPlaybook: [
    {
      week: 1,
      theme: "Foundation & Quick Wins",
      actions: [
        "Pin a 'Getting Started' guide with hackathon rules, deadlines, and recommended AI tools",
        "Create a 'Caching Solutions' megathread addressing the #1 pain point",
        "Launch daily 'What are you building?' prompts to surface inactive members",
      ],
      expectedImpact: "+15% daily active members",
    },
    {
      week: 2,
      theme: "Engagement Amplification",
      actions: [
        "Start 'Show & Tell Tuesdays' - weekly demo video sharing thread",
        "Create an 'Impact Report' post template and pin examples of high-engagement posts",
        "Host a live Q&A session with top contributors (Jake, Rachel, Emily)",
      ],
      expectedImpact: "+25% post engagement rate",
    },
    {
      week: 3,
      theme: "Knowledge Infrastructure",
      actions: [
        "Curate and organize the Toolkit Library from existing member contributions",
        "Tag and categorize top 50 posts for easy discovery by newcomers",
        "Launch a mentorship matching thread pairing experienced and new builders",
      ],
      expectedImpact: "+30% content discoverability",
    },
    {
      week: 4,
      theme: "Retention & Growth Loop",
      actions: [
        "Highlight community wins: aggregate metrics from member projects",
        "Create a 'Community Spotlight' featuring 3 outstanding members weekly",
        "Set up a feedback survey to identify next month's priorities",
      ],
      expectedImpact: "+20% month-over-month retention",
    },
  ],
  topicDetails: {
    "AI Agent Development": {
      relatedPosts: [
        "Sarah Chen shipped a customer support bot handling 80% of tickets with 4.5/5 satisfaction",
        "David Liu built an AI code reviewer that found 3 real bugs during testing",
        "Alex Kim integrated voice input with Whisper + Claude for natural intent understanding",
      ],
      sentimentBreakdown: { positive: 75, neutral: 20, negative: 5 },
      keyQuotes: [
        "The key was using structured outputs to keep responses consistent",
        "Focus on the use case, not the tech",
      ],
      trend: "rising",
    },
    "Prompt Engineering": {
      relatedPosts: [
        "Yuki Tanaka improved accuracy from 60% to 92% with persona + few-shot examples",
        "Multiple members discussing structured output formats for consistent AI responses",
      ],
      sentimentBreakdown: { positive: 70, neutral: 25, negative: 5 },
      keyQuotes: [
        "Give Claude a persona and examples of ideal outputs - accuracy went from 60% to 92%",
      ],
      trend: "rising",
    },
    "Rapid Prototyping": {
      relatedPosts: [
        "Emily Watson built a full-stack meal planner in Next.js + FastAPI during week 2",
        "Tom Wilson learned to scope down: from multi-modal assistant to focused text summarizer",
        "Priya Sharma shared a hackathon toolkit that saves 2+ hours of setup",
      ],
      sentimentBreakdown: { positive: 65, neutral: 30, negative: 5 },
      keyQuotes: [
        "Ship something small that works perfectly",
        "Template repo saves 2+ hours of setup",
      ],
      trend: "stable",
    },
    "Demo & Presentation Tips": {
      relatedPosts: [
        "Lisa Chang shared pro tips: under 2 min, show product working, explain WHO in first 10 seconds",
        "Ryan O'Connor emphasized function over form: don't over-polish if core feature is buggy",
        "Rachel Park noted posts with specific numbers get 10x more engagement",
      ],
      sentimentBreakdown: { positive: 80, neutral: 18, negative: 2 },
      keyQuotes: [
        "Keep it under 2 minutes, show the product WORKING, grab attention fast",
        "Does it work is #1 in judging criteria",
      ],
      trend: "rising",
    },
    "RAG & Document Processing": {
      relatedPosts: [
        "Marcus Rodriguez working with 10k+ PDFs, exploring semantic chunking vs recursive splitting",
        "Several members discussing optimal chunk sizes and embedding strategies",
      ],
      sentimentBreakdown: { positive: 45, neutral: 45, negative: 10 },
      keyQuotes: [
        "Chunking strategies make a huge difference with large document sets",
      ],
      trend: "stable",
    },
    "Team Formation": {
      relatedPosts: [
        "Chris Brown looking for Next.js developer for AI quiz generator project",
        "Multiple team-seeking posts, some with specific role requirements",
      ],
      sentimentBreakdown: { positive: 55, neutral: 35, negative: 10 },
      keyQuotes: [
        "We already have the AI pipeline working, need frontend help",
      ],
      trend: "declining",
    },
    "API Rate Limits & Caching": {
      relatedPosts: [
        "Maria Garcia lost 3 hours debugging timeout errors before adding Redis cache",
        "Multiple members reporting rate limit issues during intensive development",
      ],
      sentimentBreakdown: { positive: 20, neutral: 35, negative: 45 },
      keyQuotes: [
        "Implement caching early! We wasted 3 hours debugging timeout errors",
      ],
      trend: "stable",
    },
    "Deployment & DevOps": {
      relatedPosts: [
        "Priya Sharma recommends Vercel for deployment in her toolkit",
        "Members sharing deployment strategies and CI/CD tips",
      ],
      sentimentBreakdown: { positive: 50, neutral: 40, negative: 10 },
      keyQuotes: [
        "Vercel for deployment, Cursor for coding, Claude for analysis",
      ],
      trend: "stable",
    },
  },
  dataConfidence: "high",
  dataSourceNote: "Demo data -- sample analysis for demonstration",
};
