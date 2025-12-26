import { NextResponse } from "next/server";
import { db, books } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const book = await db.query.books.findFirst({
      where: eq(books.slug, slug),
      with: {
        chapters: {
          with: {
            pages: {
              orderBy: (pages, { asc }) => [asc(pages.sortOrder)],
            },
          },
          orderBy: (chapters, { asc }) => [asc(chapters.sortOrder)],
        },
        pages: {
          orderBy: (pages, { asc }) => [asc(pages.sortOrder)],
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Separate direct pages (without chapter) from chapter pages
    const directPages = book.pages.filter((p) => !p.chapterId);

    return NextResponse.json({
      id: book.id,
      name: book.name,
      description: book.description,
      chapters: book.chapters.map((chapter) => ({
        id: chapter.id,
        name: chapter.name,
        slug: chapter.slug,
        pages: chapter.pages.map((page) => ({
          id: page.id,
          name: page.name,
          slug: page.slug,
          html: page.html,
          chapterId: page.chapterId,
        })),
      })),
      directPages: directPages.map((page) => ({
        id: page.id,
        name: page.name,
        slug: page.slug,
        html: page.html,
        chapterId: page.chapterId,
      })),
    });
  } catch (error) {
    console.error("Error fetching book for reading:", error);
    return NextResponse.json(
      { error: "Failed to fetch book" },
      { status: 500 }
    );
  }
}
