import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config";
import type { ScrapeResult, SummaryResult, ChapterSummary } from "../types";

export async function summarizeContent(
  scrapeResult: ScrapeResult,
  options: {
    language?: "id" | "en";
    bookName?: string;
    apiKey: string;
    model?: string;
  }
): Promise<SummaryResult> {
  const { language = "id", bookName, apiKey, model } = options;

  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model: model || config.gemini.model
  });

  const chunks = chunkContent(scrapeResult.content, config.summarizer.chunkSize);

  // If content is small enough, summarize in one go
  if (chunks.length === 1) {
    return await summarizeSingle(geminiModel, scrapeResult, language, bookName);
  }

  // For larger content, summarize chunks then combine
  return await summarizeChunks(geminiModel, scrapeResult, chunks, language, bookName);
}

async function summarizeSingle(
  model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>,
  scrapeResult: ScrapeResult,
  language: "id" | "en",
  bookName?: string
): Promise<SummaryResult> {
  const langInstruction = language === "id"
    ? "Tulis dalam Bahasa Indonesia yang baik dan benar."
    : "Write in clear English.";

  const prompt = `You are a documentation summarizer. Your task is to summarize the following documentation into a structured book format.

${langInstruction}

Documentation Title: ${scrapeResult.title}
Source URL: ${scrapeResult.url}

Content:
${scrapeResult.content}

Please create a summary with the following JSON structure:
{
  "title": "${bookName || scrapeResult.title}",
  "summary": "A brief 2-3 sentence overview of what this documentation covers",
  "chapters": [
    {
      "title": "Chapter title",
      "content": "Chapter content as markdown (keep it concise but informative, include key concepts and examples)"
    }
  ]
}

Guidelines:
- Create 2-5 chapters based on the content
- Each chapter should cover a distinct topic or section
- Keep the content informative but concise
- Preserve important code examples and key concepts
- Use markdown formatting for the content

Respond with only the JSON, no additional text.`;

  const result = await model.generateContent(prompt);
  const content = result.response.text();

  try {
    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
    const jsonStr = jsonMatch[1]?.trim() || content.trim();
    const parsed = JSON.parse(jsonStr) as SummaryResult;
    return parsed;
  } catch (error) {
    console.error("Failed to parse Gemini response:", content);
    throw new Error("Failed to parse summarization result");
  }
}

async function summarizeChunks(
  model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>,
  scrapeResult: ScrapeResult,
  chunks: string[],
  language: "id" | "en",
  bookName?: string
): Promise<SummaryResult> {
  const langInstruction = language === "id"
    ? "Tulis dalam Bahasa Indonesia yang baik dan benar."
    : "Write in clear English.";

  // Summarize each chunk
  const chunkSummaries: ChapterSummary[] = [];

  for (let i = 0; i < Math.min(chunks.length, config.summarizer.maxChunks); i++) {
    const chunk = chunks[i];

    const prompt = `You are a documentation summarizer. Summarize this section of documentation.

${langInstruction}

Section ${i + 1} of ${chunks.length}:
${chunk}

Create a summary as JSON:
{
  "title": "A descriptive title for this section",
  "content": "Summary content in markdown format"
}

Respond with only the JSON.`;

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1]?.trim() || content.trim();
      const chapter = JSON.parse(jsonStr) as ChapterSummary;
      chunkSummaries.push(chapter);
    } catch (error) {
      // If parsing fails, create a basic chapter
      chunkSummaries.push({
        title: `Section ${i + 1}`,
        content: chunk.substring(0, 500) + "...",
      });
    }
  }

  // Create overall summary
  const overviewPrompt = `${langInstruction}

Based on these chapter summaries, create a brief 2-3 sentence overview:
${chunkSummaries.map((c) => `- ${c.title}: ${c.content.substring(0, 100)}...`).join("\n")}

Respond with only the overview text, no JSON.`;

  const overviewResult = await model.generateContent(overviewPrompt);
  const summary = overviewResult.response.text().trim() ||
    "A comprehensive summary of the documentation.";

  return {
    title: bookName || scrapeResult.title,
    summary,
    chapters: chunkSummaries,
  };
}

function chunkContent(content: string, chunkSize: number): string[] {
  const chunks: string[] = [];

  // Try to split at paragraph boundaries
  const paragraphs = content.split(/\n\n+/);
  let currentChunk = "";

  for (const para of paragraphs) {
    if (currentChunk.length + para.length > chunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = para;
    } else {
      currentChunk += "\n\n" + para;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [content];
}
