import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db, books, chapters, pages, revisions } from "@/lib/db";
import slugify from "slugify";
import { nanoid } from "nanoid";

interface GeneratedPage {
  name: string;
  content: string;
  html: string;
}

interface GeneratedChapter {
  name: string;
  pages: GeneratedPage[];
}

interface GeneratedBook {
  name: string;
  description: string;
  chapters: GeneratedChapter[];
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { book } = (await request.json()) as { book: GeneratedBook };

    if (!book || !book.name) {
      return NextResponse.json({ error: "Invalid book data" }, { status: 400 });
    }

    // Create the book
    const bookSlug = `${slugify(book.name, { lower: true, strict: true })}-${nanoid(6)}`;
    const [createdBook] = await db
      .insert(books)
      .values({
        name: book.name,
        slug: bookSlug,
        description: book.description,
        createdBy: session.user.id,
      })
      .returning();

    // Create chapters and pages
    for (let chapterIndex = 0; chapterIndex < book.chapters.length; chapterIndex++) {
      const chapter = book.chapters[chapterIndex];

      // Create chapter
      const chapterSlug = `${slugify(chapter.name, { lower: true, strict: true })}-${nanoid(6)}`;
      const [createdChapter] = await db
        .insert(chapters)
        .values({
          name: chapter.name,
          slug: chapterSlug,
          bookId: createdBook.id,
          sortOrder: chapterIndex,
          createdBy: session.user.id,
        })
        .returning();

      // Create pages for this chapter
      for (let pageIndex = 0; pageIndex < chapter.pages.length; pageIndex++) {
        const page = chapter.pages[pageIndex];

        const pageSlug = `${slugify(page.name, { lower: true, strict: true })}-${nanoid(6)}`;
        const [createdPage] = await db
          .insert(pages)
          .values({
            name: page.name,
            slug: pageSlug,
            content: page.content,
            html: page.html,
            bookId: createdBook.id,
            chapterId: createdChapter.id,
            sortOrder: pageIndex,
            draft: false,
            createdBy: session.user.id,
          })
          .returning();

        // Create initial revision
        await db.insert(revisions).values({
          pageId: createdPage.id,
          content: page.content,
          html: page.html,
          revisionNumber: 1,
          createdBy: session.user.id,
        });
      }
    }

    revalidatePath("/books");
    revalidatePath("/pages");

    return NextResponse.json({
      success: true,
      slug: createdBook.slug,
      id: createdBook.id,
    });
  } catch (error) {
    console.error("Create book error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create book" },
      { status: 500 }
    );
  }
}
