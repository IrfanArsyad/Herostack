import { NextRequest, NextResponse } from "next/server";
import { db, books } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  generateBookMarkdown,
  generateBookHtml,
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

  // Fetch book with chapters and pages
  const book = await db.query.books.findFirst({
    where: eq(books.slug, slug),
    with: {
      chapters: {
        orderBy: (chapters, { asc }) => [asc(chapters.sortOrder)],
        with: {
          pages: {
            orderBy: (pages, { asc }) => [asc(pages.sortOrder)],
          },
        },
      },
      pages: {
        orderBy: (pages, { asc }) => [asc(pages.sortOrder)],
      },
    },
  });

  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  // Separate direct pages (without chapter)
  const directPages = book.pages.filter((p) => !p.chapterId);

  const bookData = {
    id: book.id,
    name: book.name,
    slug: book.slug,
    chapters: book.chapters.map((ch) => ({
      id: ch.id,
      name: ch.name,
      slug: ch.slug,
      pages: ch.pages.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        html: p.html,
        content: p.content,
      })),
    })),
    directPages: directPages.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      html: p.html,
      content: p.content,
    })),
  };

  const filename = getFilename(book.name, format);

  if (format === "markdown") {
    const markdown = generateBookMarkdown(bookData);
    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  // Generate PDF from HTML
  const html = generateBookHtml(bookData);
  const pdfBytes = await generatePdf(html);

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
