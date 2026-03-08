import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import type { CommunityPost, ScrapeResult, DataQuality } from "@/lib/types";

const SKOOL_SLUG_RE = /^\/([a-zA-Z0-9-]+)/;
const SKOOL_PROFILE_RE = /^\/@/;
const MEMBER_COUNT_RE = /([\d,.]+)\s*members?/i;
const BUILD_ID_RE = /"buildId"\s*:\s*"([^"]+)"/;

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

function validateSkoolUrl(input: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  if (parsed.hostname !== "skool.com" && parsed.hostname !== "www.skool.com")
    return null;
  const slug = parsed.pathname.match(SKOOL_SLUG_RE)?.[1];
  if (!slug) return null;
  return slug;
}

// Level 1: Try _next/data JSON API for structured data
async function tryNextData(
  slug: string,
  html: string
): Promise<{ posts: CommunityPost[]; memberCount?: string } | null> {
  try {
    const buildIdMatch = html.match(BUILD_ID_RE);
    if (!buildIdMatch) return null;

    const buildId = buildIdMatch[1];
    const dataUrl = `https://www.skool.com/_next/data/${buildId}/${slug}.json`;

    const res = await fetch(dataUrl, {
      headers: {
        ...FETCH_HEADERS,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) return null;

    const json = await res.json();
    const pageProps = json?.pageProps;
    if (!pageProps) return null;

    const posts: CommunityPost[] = [];

    // Extract posts from pageProps (structure varies)
    const rawPosts =
      pageProps.posts ||
      pageProps.feed?.posts ||
      pageProps.initialPosts ||
      [];

    for (const p of rawPosts.slice(0, 50)) {
      posts.push({
        author: p.user?.name || p.author?.name || p.userName || "Member",
        content: (p.content || p.text || p.body || "").slice(0, 500),
        likes: p.likeCount || p.likes || p.numLikes || 0,
        comments: p.commentCount || p.comments || p.numComments || 0,
        timestamp: p.createdAt || p.date || new Date().toISOString(),
        category: p.category?.name || p.categoryName,
      });
    }

    const memberCount =
      pageProps.group?.memberCount?.toString() ||
      pageProps.community?.memberCount?.toString();

    return posts.length > 0 ? { posts, memberCount } : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "Please provide a valid Skool community URL" },
        { status: 400 }
      );
    }

    const slug = validateSkoolUrl(url);
    if (!slug) {
      // Check if it's a profile URL for a better error message
      try {
        const parsed = new URL(url);
        if (
          (parsed.hostname === "skool.com" || parsed.hostname === "www.skool.com") &&
          SKOOL_PROFILE_RE.test(parsed.pathname)
        ) {
          return NextResponse.json(
            { error: "Profile URLs are not supported. Please enter a community URL (e.g. https://www.skool.com/your-community)" },
            { status: 400 }
          );
        }
      } catch { /* ignore parse errors */ }

      return NextResponse.json(
        {
          error:
            "Please provide a valid Skool community URL (e.g. https://www.skool.com/your-community)",
        },
        { status: 400 }
      );
    }

    const communityUrl = `https://www.skool.com/${slug}`;

    let communityName = slug
      .split("-")
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    let description = "";
    let memberCount = "Unknown";
    let posts: CommunityPost[] = [];
    let isPrivate = false;
    let source: DataQuality["source"] = "cheerio";

    // Fetch community page and about page in parallel
    const [mainResult, aboutResult] = await Promise.allSettled([
      fetch(communityUrl, {
        headers: FETCH_HEADERS,
        signal: AbortSignal.timeout(4000),
      }),
      fetch(`${communityUrl}/about`, {
        headers: FETCH_HEADERS,
        signal: AbortSignal.timeout(4000),
      }),
    ]);

    let mainHtml = "";

    // Process main page
    if (mainResult.status === "fulfilled" && mainResult.value.ok) {
      mainHtml = await mainResult.value.text();
      const $ = cheerio.load(mainHtml);

      // Detect private community
      const hasLoginForm =
        $('input[type="password"]').length > 0 ||
        $('form[action*="login"]').length > 0 ||
        mainHtml.includes("Sign in to continue") ||
        mainHtml.includes("This group is private");
      if (hasLoginForm) {
        isPrivate = true;
      }

      communityName =
        $('meta[property="og:title"]').attr("content") || communityName;
      description =
        $('meta[property="og:description"]').attr("content") || "";

      // Level 1: Try _next/data for real post data
      if (!isPrivate) {
        const nextData = await tryNextData(slug, mainHtml);
        if (nextData) {
          posts = nextData.posts;
          if (nextData.memberCount) {
            memberCount = nextData.memberCount;
          }
          source = "nextdata";
        }
      }

      // Level 2: Cheerio fallback for posts (SPA usually yields nothing)
      if (posts.length === 0) {
        $("[data-testid*='post'], .post, article").each((_, el) => {
          const $el = $(el);
          posts.push({
            author:
              $el.find("[data-testid*='author'], .author").text().trim() ||
              "Community Member",
            content: $el
              .find("[data-testid*='content'], .content, p")
              .text()
              .trim(),
            likes:
              parseInt($el.find("[data-testid*='like'], .likes").text()) || 0,
            comments:
              parseInt(
                $el.find("[data-testid*='comment'], .comments").text()
              ) || 0,
            timestamp: new Date().toISOString(),
          });
        });
        source = "cheerio";
      }
    }

    // Process about page for member count (if not already found)
    if (
      memberCount === "Unknown" &&
      aboutResult.status === "fulfilled" &&
      aboutResult.value.ok
    ) {
      const aboutHtml = await aboutResult.value.text();
      const $about = cheerio.load(aboutHtml);
      const aboutText = $about("body").text();
      const memberMatch = aboutText.match(MEMBER_COUNT_RE);
      if (memberMatch) {
        memberCount = memberMatch[1];
      }
    }

    // Always return a result - AI can work with minimal context
    if (!description) {
      description = `A Skool community at skool.com/${slug}`;
    }

    const result: ScrapeResult = {
      communityName,
      description,
      memberCount,
      posts,
      dataQuality: {
        postsScraped: posts.length,
        manualPostsCount: 0,
        hasDescription:
          description !== `A Skool community at skool.com/${slug}`,
        hasMemberCount: memberCount !== "Unknown",
        source,
        isPrivate,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      { error: "Failed to scrape community data" },
      { status: 500 }
    );
  }
}
