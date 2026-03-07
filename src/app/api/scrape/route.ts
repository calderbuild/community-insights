import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import type { CommunityPost, ScrapeResult } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || !url.includes("skool.com")) {
      return NextResponse.json(
        { error: "Please provide a valid Skool community URL" },
        { status: 400 }
      );
    }

    const match = url.match(/skool\.com\/([^\/\?]+)/);
    if (!match) {
      return NextResponse.json(
        { error: "Could not parse Skool community URL" },
        { status: 400 }
      );
    }

    const slug = match[1];
    const communityUrl = `https://www.skool.com/${slug}`;

    let communityName = slug
      .split("-")
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    let description = "";
    let memberCount = "Unknown";
    const posts: CommunityPost[] = [];

    // Try to fetch community page - gracefully degrade if blocked
    try {
      const response = await fetch(communityUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);

        communityName =
          $('meta[property="og:title"]').attr("content") || communityName;
        description =
          $('meta[property="og:description"]').attr("content") || "";

        // Try about page for member count
        try {
          const aboutResponse = await fetch(`${communityUrl}/about`, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            },
            signal: AbortSignal.timeout(5000),
          });

          if (aboutResponse.ok) {
            const aboutHtml = await aboutResponse.text();
            const $about = cheerio.load(aboutHtml);
            const aboutText = $about("body").text();
            const memberMatch = aboutText.match(/([\d,.]+)\s*members?/i);
            if (memberMatch) {
              memberCount = memberMatch[1];
            }
          }
        } catch {
          // about page fetch failed, continue with what we have
        }

        // Extract any visible post-like content
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
      }
    } catch {
      // Fetch failed (blocked by Skool, timeout, etc.)
      // Continue with slug-derived name - AI can still analyze
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
