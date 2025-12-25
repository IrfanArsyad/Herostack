import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url, bookName, language, model, apiKey } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API Key is required" }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Dynamic import plugin modules
    const { scrapeUrl } = await import("../../../../../plugins/doc-summarizer/lib/scraper");
    const { summarizeContent } = await import("../../../../../plugins/doc-summarizer/lib/summarizer");
    const { generateBookStructure } = await import("../../../../../plugins/doc-summarizer/lib/book-generator");

    // Step 1: Scrape the URL
    const scrapeResult = await scrapeUrl(url);

    // Step 2: Summarize with Gemini
    const summaryResult = await summarizeContent(scrapeResult, {
      language: language || "id",
      bookName: bookName || undefined,
      apiKey,
      model,
    });

    // Step 3: Generate book structure
    const book = generateBookStructure(summaryResult);

    return NextResponse.json(book);
  } catch (error) {
    console.error("Summarization error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to summarize" },
      { status: 500 }
    );
  }
}
