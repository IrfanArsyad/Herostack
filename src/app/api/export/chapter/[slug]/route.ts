import { NextRequest, NextResponse } from "next/server";
import { db, chapters } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  generateChapterMarkdown,
  generateChapterHtml,
  generatePdf,
  getFilename,
  type ExportFormat,
} from "@/lib/export";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const searchParams = request.nextUrl.searchParams;
  const format = (searchParams.get("format") || "pdf") as ExportFormat;

  // Fetch chapter with pages
  const chapter = await db.query.chapters.findFirst({
    where: eq(chapters.slug, slug),
    with: {
      pages: {
        orderBy: (pages, { asc }) => [asc(pages.sortOrder)],
      },
    },
  });

  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  const chapterData = {
    id: chapter.id,
    name: chapter.name,
    slug: chapter.slug,
    pages: chapter.pages.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      html: p.html,
      content: p.content,
    })),
  };

  const filename = getFilename(chapter.name, format);

  if (format === "markdown") {
    const markdown = generateChapterMarkdown(chapterData);
    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  // Generate PDF from HTML
  const html = generateChapterHtml(chapterData);
  const pdfBytes = await generatePdf(html);

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
