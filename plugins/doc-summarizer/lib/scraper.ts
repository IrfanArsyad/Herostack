import * as cheerio from "cheerio";
import { config } from "../config";
import type { ScrapeResult, ContentSection } from "../types";

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.scraper.timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; DocSummarizer/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    clearTimeout(timeoutId);

    return parseHtml(html, url);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
}

function parseHtml(html: string, url: string): ScrapeResult {
  const $ = cheerio.load(html);

  // Remove unwanted elements
  $("script, style, nav, header, footer, aside, .sidebar, .navigation, .menu, .ad, .advertisement, .cookie-banner, .popup").remove();

  // Try to find the main content area
  const mainSelectors = [
    "main",
    "article",
    ".content",
    ".main-content",
    ".post-content",
    ".article-content",
    ".documentation",
    ".docs-content",
    "#content",
    "#main",
  ];

  let $content: ReturnType<typeof $> | null = null;

  for (const selector of mainSelectors) {
    const $el = $(selector);
    if ($el.length > 0) {
      $content = $el.first();
      break;
    }
  }

  // Fallback to body if no main content found
  if (!$content) {
    $content = $("body");
  }

  // Extract title
  const title =
    $("h1").first().text().trim() ||
    $("title").text().trim() ||
    "Untitled Document";

  // Extract sections based on headings
  const sections: ContentSection[] = [];
  let currentSection: ContentSection | null = null;

  $content.find("h1, h2, h3, h4, h5, h6, p, pre, code, ul, ol, blockquote, table").each((_, el) => {
    const $el = $(el);
    const tagName = el.tagName.toLowerCase();

    if (tagName.match(/^h[1-6]$/)) {
      // Save previous section
      if (currentSection && currentSection.content.trim()) {
        sections.push(currentSection);
      }

      const level = parseInt(tagName[1], 10);
      currentSection = {
        heading: $el.text().trim(),
        level,
        content: "",
      };
    } else if (currentSection) {
      // Add content to current section
      if (tagName === "pre" || tagName === "code") {
        currentSection.content += "\n```\n" + $el.text().trim() + "\n```\n";
      } else if (tagName === "ul" || tagName === "ol") {
        $el.find("li").each((_, li) => {
          currentSection!.content += "\n- " + $(li).text().trim();
        });
        currentSection.content += "\n";
      } else if (tagName === "blockquote") {
        currentSection.content += "\n> " + $el.text().trim() + "\n";
      } else if (tagName === "table") {
        // Simple table to text conversion
        currentSection.content += "\n[Table content]\n";
        $el.find("tr").each((_, tr) => {
          const cells: string[] = [];
          $(tr).find("th, td").each((_, cell) => {
            cells.push($(cell).text().trim());
          });
          currentSection!.content += cells.join(" | ") + "\n";
        });
      } else {
        currentSection.content += "\n" + $el.text().trim();
      }
    } else {
      // No heading yet, create a default section
      currentSection = {
        heading: "Introduction",
        level: 1,
        content: $el.text().trim(),
      };
    }
  });

  // Add last section
  if (currentSection) {
    const lastSection = currentSection as ContentSection;
    if (lastSection.content.trim()) {
      sections.push(lastSection);
    }
  }

  // Get full content text
  const fullContent = sections
    .map((s) => `## ${s.heading}\n${s.content}`)
    .join("\n\n");

  // Truncate if too long
  const content =
    fullContent.length > config.scraper.maxContentLength
      ? fullContent.substring(0, config.scraper.maxContentLength) + "\n\n[Content truncated...]"
      : fullContent;

  return {
    title,
    content,
    url,
    sections,
  };
}
