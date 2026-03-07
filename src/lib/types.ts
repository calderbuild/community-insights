export interface CommunityPost {
  author: string;
  content: string;
  likes: number;
  comments: number;
  timestamp: string;
  category?: string;
}

export interface TopicTrend {
  topic: string;
  count: number;
  sentiment: "positive" | "neutral" | "negative";
  growth: number;
}

export interface MemberInsight {
  name: string;
  posts: number;
  engagement: number;
  topTopics: string[];
}

export interface HealthScore {
  overall: number;
  contentQuality: number;
  engagement: number;
  growth: number;
  leadership: number;
  positivity: number;
}

export interface PlaybookWeek {
  week: number;
  theme: string;
  actions: string[];
  expectedImpact: string;
}

export interface TopicDetail {
  relatedPosts: string[];
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  keyQuotes: string[];
  trend: "rising" | "stable" | "declining";
}

export interface AnalysisResult {
  summary: string;
  topTopics: TopicTrend[];
  keyInsights: string[];
  memberHighlights: MemberInsight[];
  recommendations: string[];
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  healthScore: HealthScore;
  totalPosts: number;
  activeMembersCount: number;
  growthPlaybook?: PlaybookWeek[];
  topicDetails?: Record<string, TopicDetail>;
}

export interface ScrapeResult {
  communityName: string;
  description: string;
  memberCount: string;
  posts: CommunityPost[];
}
