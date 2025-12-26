import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";

// BookStack Portable ZIP format types
interface BookStackTag {
  name: string;
  value?: string;
}

interface BookStackPage {
  id?: number;
  name: string;
  html?: string;
  markdown?: string;
  priority?: number;
  tags?: BookStackTag[];
}

interface BookStackChapter {
  id?: number;
  name: string;
  description_html?: string;
  priority?: number;
  pages?: BookStackPage[];
  tags?: BookStackTag[];
}

interface BookStackBook {
  id?: number;
  name: string;
  description_html?: string;
  cover?: string;
  chapters?: BookStackChapter[];
  pages?: BookStackPage[];
  tags?: BookStackTag[];
}

interface BookStackExport {
  instance?: {
    version?: string;
    id?: string;
  };
  exported_at?: string;
  book?: BookStackBook;
  chapter?: BookStackChapter;
  page?: BookStackPage;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100) + "-" + Date.now().toString(36);
}

function htmlToPlainDescription(html?: string): string | null {
  if (!html) return null;
  // Simple HTML to text conversion
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 500);
}

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check permission
  const { authorized, error } = await requirePermission("books:create");
  if (!authorized) {
    return NextResponse.json({ error }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const shelfId = formData.get("shelfId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read the ZIP file
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Find and parse data.json
    const dataJsonFile = zip.file("data.json");
    if (!dataJsonFile) {
      return NextResponse.json(
        { error: "Invalid BookStack export: data.json not found" },
        { status: 400 }
      );
    }

    const dataJsonContent = await dataJsonFile.async("string");
    const exportData: BookStackExport = JSON.parse(dataJsonContent);

    // Determine what type of export this is
    if (exportData.book) {
      const result = await importBook(exportData.book, session.user.id, shelfId);
      return NextResponse.json({
        success: true,
        message: `Book "${result.bookName}" imported successfully`,
        book: result,
      });
    } else if (exportData.chapter) {
      return NextResponse.json(
        { error: "Chapter-only imports require a target book. Please import a full book export." },
        { status: 400 }
      );
    } else if (exportData.page) {
      return NextResponse.json(
        { error: "Page-only imports require a target book. Please import a full book export." },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { error: "Invalid BookStack export: no book, chapter, or page found" },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import failed" },
      { status: 500 }
    );
  }
}

async function importBook(
  bookData: BookStackBook,
  userId: string,
  shelfId: string | null
) {
  // Create the book
  const [book] = await db
    .insert(schema.books)
    .values({
      name: bookData.name,
      slug: generateSlug(bookData.name),
      description: htmlToPlainDescription(bookData.description_html),
      shelfId: shelfId || null,
      createdBy: userId,
    })
    .returning();

  let chaptersCreated = 0;
  let pagesCreated = 0;

  // Import chapters with their pages
  if (bookData.chapters && bookData.chapters.length > 0) {
    // Sort by priority
    const sortedChapters = [...bookData.chapters].sort(
      (a, b) => (a.priority || 0) - (b.priority || 0)
    );

    for (let i = 0; i < sortedChapters.length; i++) {
      const chapterData = sortedChapters[i];

      const [chapter] = await db
        .insert(schema.chapters)
        .values({
          bookId: book.id,
          name: chapterData.name,
          slug: generateSlug(chapterData.name),
          description: htmlToPlainDescription(chapterData.description_html),
          sortOrder: i,
          createdBy: userId,
        })
        .returning();

      chaptersCreated++;

      // Import pages within chapter
      if (chapterData.pages && chapterData.pages.length > 0) {
        const sortedPages = [...chapterData.pages].sort(
          (a, b) => (a.priority || 0) - (b.priority || 0)
        );

        for (let j = 0; j < sortedPages.length; j++) {
          const pageData = sortedPages[j];

          // Determine content - prefer markdown, fallback to html
          let html = pageData.html || null;
          const markdown = pageData.markdown || null;

          // If markdown provided, we'll store it as HTML (BookStack uses markdown editor)
          // For now, we'll just use the HTML if available, or convert markdown later
          if (!html && markdown) {
            // Simple markdown to HTML (basic conversion)
            html = `<p>${markdown.replace(/\n/g, "</p><p>")}</p>`;
          }

          await db.insert(schema.pages).values({
            bookId: book.id,
            chapterId: chapter.id,
            name: pageData.name,
            slug: generateSlug(pageData.name),
            html: html,
            content: markdown,
            sortOrder: j,
            draft: false,
            createdBy: userId,
          });

          pagesCreated++;
        }
      }

      // Import chapter tags
      if (chapterData.tags && chapterData.tags.length > 0) {
        await importTags(chapterData.tags, chapter.id, "chapter");
      }
    }
  }

  // Import direct pages (pages without chapter)
  if (bookData.pages && bookData.pages.length > 0) {
    const sortedPages = [...bookData.pages].sort(
      (a, b) => (a.priority || 0) - (b.priority || 0)
    );

    for (let j = 0; j < sortedPages.length; j++) {
      const pageData = sortedPages[j];

      let html = pageData.html || null;
      const markdown = pageData.markdown || null;

      if (!html && markdown) {
        html = `<p>${markdown.replace(/\n/g, "</p><p>")}</p>`;
      }

      await db.insert(schema.pages).values({
        bookId: book.id,
        chapterId: null,
        name: pageData.name,
        slug: generateSlug(pageData.name),
        html: html,
        content: markdown,
        sortOrder: j,
        draft: false,
        createdBy: userId,
      });

      pagesCreated++;
    }
  }

  // Import book tags
  if (bookData.tags && bookData.tags.length > 0) {
    await importTags(bookData.tags, book.id, "book");
  }

  return {
    bookId: book.id,
    bookName: book.name,
    bookSlug: book.slug,
    chaptersCreated,
    pagesCreated,
  };
}

async function importTags(
  tags: BookStackTag[],
  entityId: string,
  entityType: "book" | "chapter" | "page"
) {
  for (const tagData of tags) {
    // Find or create tag
    let tag = await db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.name, tagData.name),
    });

    if (!tag) {
      const [newTag] = await db
        .insert(schema.tags)
        .values({
          name: tagData.name,
          slug: generateSlug(tagData.name),
        })
        .returning();
      tag = newTag;
    }

    // Create taggable relationship
    await db.insert(schema.taggables).values({
      tagId: tag.id,
      taggableId: entityId,
      taggableType: entityType,
    });
  }
}
