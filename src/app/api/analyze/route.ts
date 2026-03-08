import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai";
import type { AnalysisResult, ScrapeResult, DataQuality } from "@/lib/types";

function computeConfidence(
  quality: DataQuality | undefined,
  manualInput: string | undefined
): { confidence: "high" | "medium" | "low"; note: string } {
  const postsScraped = quality?.postsScraped ?? 0;
  const manualLines = manualInput
    ? manualInput.split("\n").filter((l) => l.trim().length > 10).length
    : 0;
  const totalPosts = postsScraped + manualLines;

  if (totalPosts >= 20)
    return { confidence: "high", note: `Based on ${totalPosts} real posts` };
  if (totalPosts >= 5)
    return {
      confidence: "medium",
      note: `Based on ${totalPosts} posts + AI estimates`,
    };
  return { confidence: "low", note: "AI estimate from community description" };
}

export async function POST(req: NextRequest) {
  try {
    const scrapeData: ScrapeResult & { manualInput?: string } =
      await req.json();

    // Limit manualInput to 100K characters
    if (scrapeData.manualInput && scrapeData.manualInput.length > 100_000) {
      scrapeData.manualInput = scrapeData.manualInput.slice(0, 100_000);
    }

    const contextParts: string[] = [];
    contextParts.push(`Community: ${scrapeData.communityName}`);
    contextParts.push(`Description: ${scrapeData.description}`);
    contextParts.push(`Members: ${scrapeData.memberCount}`);

    if (scrapeData.posts && scrapeData.posts.length > 0) {
      contextParts.push(
        `\nPosts (${scrapeData.posts.length} total):\n` +
          scrapeData.posts
            .slice(0, 50)
            .map(
              (p, i) =>
                `${i + 1}. [${p.author}] ${p.content.slice(0, 200)} (${p.likes} likes, ${p.comments} comments)`
            )
            .join("\n")
      );
    }

    const hasPostData =
      (scrapeData.posts && scrapeData.posts.length > 0) ||
      !!scrapeData.manualInput;

    if (scrapeData.manualInput) {
      contextParts.push(
        `\nThe following are real community posts provided by the community manager:\n${scrapeData.manualInput}`
      );
    }

    const topicDetailsInstruction = hasPostData
      ? `"topicDetails": {
    "Topic Name": {
      "relatedPosts": ["summary of related post 1", "summary of related post 2"],
      "sentimentBreakdown": {"positive": 70, "neutral": 20, "negative": 10},
      "keyQuotes": ["notable quote from a post"],
      "trend": "rising|stable|declining"
    }
  },`
      : "";

    const prompt = `You are an expert community analyst specializing in online communities. Analyze the following community data and provide comprehensive, specific insights.

${contextParts.join("\n")}

Respond with a JSON object (no markdown, no code fences, just raw JSON) matching this exact structure:
{
  "summary": "2-3 sentence executive summary of the community's health and key themes. Be specific, reference actual topics and patterns.",
  "healthScore": {
    "overall": <0-100 weighted average>,
    "contentQuality": <0-100 how valuable and original is the content>,
    "engagement": <0-100 how actively do members interact>,
    "growth": <0-100 trajectory and momentum>,
    "leadership": <0-100 how active and effective are community leaders>,
    "positivity": <0-100 overall tone and supportiveness>
  },
  "topTopics": [
    {"topic": "Topic Name", "count": <estimated_discussion_count>, "sentiment": "positive|neutral|negative", "growth": <percentage_as_number>}
  ],
  "keyInsights": ["insight1 - be specific, reference data points", "insight2", "insight3", "insight4", "insight5"],
  "memberHighlights": [
    {"name": "Member Name or Type", "posts": <count>, "engagement": <score_0_to_100>, "topTopics": ["topic1", "topic2"]}
  ],
  "recommendations": ["specific actionable recommendation 1", "recommendation 2", "recommendation 3"],
  "sentiment": {"positive": <0-100>, "neutral": <0-100>, "negative": <0-100>},
  "totalPosts": <estimated_total>,
  "activeMembersCount": <estimated_active>,
  "growthPlaybook": [
    {"week": 1, "theme": "Week theme", "actions": ["specific action 1", "action 2", "action 3"], "expectedImpact": "what this achieves"},
    {"week": 2, "theme": "Week theme", "actions": ["action 1", "action 2", "action 3"], "expectedImpact": "what this achieves"},
    {"week": 3, "theme": "Week theme", "actions": ["action 1", "action 2", "action 3"], "expectedImpact": "what this achieves"},
    {"week": 4, "theme": "Week theme", "actions": ["action 1", "action 2", "action 3"], "expectedImpact": "what this achieves"}
  ]${hasPostData ? "," : ""}
  ${topicDetailsInstruction}
}

Generate 5-8 topics, 5 key insights, 3-5 member highlights, and 3-5 recommendations.
The healthScore should reflect realistic assessment - not everything is perfect. Be honest.
The growthPlaybook should contain 4 weeks of specific, actionable steps tailored to this community.
${hasPostData ? "For topicDetails, provide drill-down data for each topic in topTopics, referencing specific posts." : ""}
Base your analysis on all available data. If post data is provided, cite specific posts, members, and patterns.
Make the analysis specific and actionable, not generic.`;

    const responseText = await callAI(prompt);

    let analysis: AnalysisResult;
    try {
      analysis = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    }

    // Ensure healthScore exists with defaults
    if (!analysis.healthScore) {
      analysis.healthScore = {
        overall: 75,
        contentQuality: 70,
        engagement: 75,
        growth: 70,
        leadership: 80,
        positivity: 75,
      };
    }

    // Validate and provide defaults for core fields
    if (!analysis.sentiment) {
      analysis.sentiment = { positive: 50, neutral: 35, negative: 15 };
    }
    if (!Array.isArray(analysis.topTopics)) {
      analysis.topTopics = [];
    }
    if (!Array.isArray(analysis.keyInsights)) {
      analysis.keyInsights = [];
    }
    if (!Array.isArray(analysis.memberHighlights)) {
      analysis.memberHighlights = [];
    }
    if (!Array.isArray(analysis.recommendations)) {
      analysis.recommendations = [];
    }
    if (typeof analysis.totalPosts !== "number") {
      analysis.totalPosts = 0;
    }
    if (typeof analysis.activeMembersCount !== "number") {
      analysis.activeMembersCount = 0;
    }

    // Deterministic confidence computation
    const { confidence, note } = computeConfidence(
      scrapeData.dataQuality,
      scrapeData.manualInput
    );
    analysis.dataConfidence = confidence;
    analysis.dataSourceNote = note;

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    const message =
      error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
