import { NextRequest, NextResponse } from "next/server";
import { db, pages } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  generatePageMarkdown,
  generatePageHtml,
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

  // Fetch page
  const page = await db.query.pages.findFirst({
    where: eq(pages.slug, slug),
  });

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const pageData = {
    id: page.id,
    name: page.name,
    slug: page.slug,
    html: page.html,
    content: page.content,
  };

  const filename = getFilename(page.name, format);

  if (format === "markdown") {
    const markdown = generatePageMarkdown(pageData);
    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  // Generate PDF from HTML
  const html = generatePageHtml(pageData);
  const pdfBytes = await generatePdf(html);

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
