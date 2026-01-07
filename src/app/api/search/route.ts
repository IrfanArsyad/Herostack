import { NextResponse } from "next/server";
import { db, shelves, books, chapters, pages, isDatabaseSqlite } from "@/lib/db";
import { sql, like, or } from "drizzle-orm";

// Helper to strip HTML tags for snippet extraction
function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// Helper to extract snippet around matched term
function extractSnippet(text: string, query: string, length: number = 150): string {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return text.slice(0, length) + (text.length > length ? "..." : "");

  const start = Math.max(0, index - 50);
  const end = Math.min(text.length, index + query.length + 100);

  let snippet = text.slice(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";

  return snippet;
}

// SQLite-compatible search using LIKE
async function searchSqlite(query: string, type?: string | null) {
  const searchPattern = `%${query}%`;
  const results: Array<{
    id: string;
    type: "shelf" | "book" | "chapter" | "page";
    name: string;
    slug: string;
    snippet: string | null;
    rank: number;
  }> = [];

  // Search shelves
  if (!type || type === "shelf") {
    const shelfResults = await db
      .select({
        id: shelves.id,
        name: shelves.name,
        slug: shelves.slug,
        description: shelves.description,
      })
      .from(shelves)
      .where(
        or(
          like(shelves.name, searchPattern),
          like(shelves.description, searchPattern)
        )
      )
      .limit(10);

    for (const row of shelfResults) {
      results.push({
        id: row.id,
        type: "shelf",
        name: row.name,
        slug: row.slug,
        snippet: row.description ? extractSnippet(row.description, query) : null,
        rank: row.name.toLowerCase().includes(query.toLowerCase()) ? 2 : 1,
      });
    }
  }

  // Search books
  if (!type || type === "book") {
    const bookResults = await db
      .select({
        id: books.id,
        name: books.name,
        slug: books.slug,
        description: books.description,
      })
      .from(books)
      .where(
        or(
          like(books.name, searchPattern),
          like(books.description, searchPattern)
        )
      )
      .limit(10);

    for (const row of bookResults) {
      results.push({
        id: row.id,
        type: "book",
        name: row.name,
        slug: row.slug,
        snippet: row.description ? extractSnippet(row.description, query) : null,
        rank: row.name.toLowerCase().includes(query.toLowerCase()) ? 2 : 1,
      });
    }
  }

  // Search chapters
  if (!type || type === "chapter") {
    const chapterResults = await db
      .select({
        id: chapters.id,
        name: chapters.name,
        slug: chapters.slug,
        description: chapters.description,
      })
      .from(chapters)
      .where(
        or(
          like(chapters.name, searchPattern),
          like(chapters.description, searchPattern)
        )
      )
      .limit(10);

    for (const row of chapterResults) {
      results.push({
        id: row.id,
        type: "chapter",
        name: row.name,
        slug: row.slug,
        snippet: row.description ? extractSnippet(row.description, query) : null,
        rank: row.name.toLowerCase().includes(query.toLowerCase()) ? 2 : 1,
      });
    }
  }

  // Search pages
  if (!type || type === "page") {
    const pageResults = await db
      .select({
        id: pages.id,
        name: pages.name,
        slug: pages.slug,
        html: pages.html,
        content: pages.content,
      })
      .from(pages)
      .where(
        or(
          like(pages.name, searchPattern),
          like(pages.content, searchPattern),
          like(pages.html, searchPattern)
        )
      )
      .limit(15);

    for (const row of pageResults) {
      const plainText = stripHtml(row.html || row.content);
      results.push({
        id: row.id,
        type: "page",
        name: row.name,
        slug: row.slug,
        snippet: plainText ? extractSnippet(plainText, query) : null,
        rank: row.name.toLowerCase().includes(query.toLowerCase()) ? 2 : 1,
      });
    }
  }

  return results;
}

// PostgreSQL full-text search
async function searchPostgres(query: string, type?: string | null) {
  const searchTerms = query.trim().split(/\s+/).filter(t => t.length > 1);
  const tsQuery = searchTerms.map(t => `${t}:*`).join(" & ");
  const searchPattern = `%${query}%`;

  const results: Array<{
    id: string;
    type: "shelf" | "book" | "chapter" | "page";
    name: string;
    slug: string;
    snippet: string | null;
    rank: number;
  }> = [];

  // Search shelves with full-text search
  if (!type || type === "shelf") {
    const shelfResults = await db.execute(sql`
      SELECT id, name, slug, description,
        ts_rank(
          to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')),
          to_tsquery('english', ${tsQuery})
        ) as rank
      FROM shelves
      WHERE
        to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')) @@ to_tsquery('english', ${tsQuery})
        OR name ILIKE ${searchPattern}
        OR description ILIKE ${searchPattern}
      ORDER BY rank DESC
      LIMIT 10
    `);

    for (const row of shelfResults as any[]) {
      results.push({
        id: row.id,
        type: "shelf",
        name: row.name,
        slug: row.slug,
        snippet: row.description ? extractSnippet(row.description, query) : null,
        rank: parseFloat(row.rank) || 0,
      });
    }
  }

  // Search books with full-text search
  if (!type || type === "book") {
    const bookResults = await db.execute(sql`
      SELECT id, name, slug, description,
        ts_rank(
          to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')),
          to_tsquery('english', ${tsQuery})
        ) as rank
      FROM books
      WHERE
        to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')) @@ to_tsquery('english', ${tsQuery})
        OR name ILIKE ${searchPattern}
        OR description ILIKE ${searchPattern}
      ORDER BY rank DESC
      LIMIT 10
    `);

    for (const row of bookResults as any[]) {
      results.push({
        id: row.id,
        type: "book",
        name: row.name,
        slug: row.slug,
        snippet: row.description ? extractSnippet(row.description, query) : null,
        rank: parseFloat(row.rank) || 0,
      });
    }
  }

  // Search chapters with full-text search
  if (!type || type === "chapter") {
    const chapterResults = await db.execute(sql`
      SELECT id, name, slug, description,
        ts_rank(
          to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')),
          to_tsquery('english', ${tsQuery})
        ) as rank
      FROM chapters
      WHERE
        to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')) @@ to_tsquery('english', ${tsQuery})
        OR name ILIKE ${searchPattern}
        OR description ILIKE ${searchPattern}
      ORDER BY rank DESC
      LIMIT 10
    `);

    for (const row of chapterResults as any[]) {
      results.push({
        id: row.id,
        type: "chapter",
        name: row.name,
        slug: row.slug,
        snippet: row.description ? extractSnippet(row.description, query) : null,
        rank: parseFloat(row.rank) || 0,
      });
    }
  }

  // Search pages with full-text search on content
  if (!type || type === "page") {
    const pageResults = await db.execute(sql`
      SELECT id, name, slug, html, content,
        ts_rank(
          to_tsvector('english', coalesce(name, '') || ' ' || coalesce(content, '') || ' ' || coalesce(html, '')),
          to_tsquery('english', ${tsQuery})
        ) as rank
      FROM pages
      WHERE
        to_tsvector('english', coalesce(name, '') || ' ' || coalesce(content, '') || ' ' || coalesce(html, '')) @@ to_tsquery('english', ${tsQuery})
        OR name ILIKE ${searchPattern}
        OR content ILIKE ${searchPattern}
        OR html ILIKE ${searchPattern}
      ORDER BY rank DESC
      LIMIT 15
    `);

    for (const row of pageResults as any[]) {
      const plainText = stripHtml(row.html || row.content);
      results.push({
        id: row.id,
        type: "page",
        name: row.name,
        slug: row.slug,
        snippet: plainText ? extractSnippet(plainText, query) : null,
        rank: parseFloat(row.rank) || 0,
      });
    }
  }

  return results;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const type = searchParams.get("type"); // Optional filter: shelf, book, chapter, page

  if (!query || query.trim().length < 2) {
    return NextResponse.json([]);
  }

  try {
    // Use appropriate search method based on database type
    const results = isDatabaseSqlite
      ? await searchSqlite(query, type)
      : await searchPostgres(query, type);

    // Sort all results by rank
    results.sort((a, b) => b.rank - a.rank);

    return NextResponse.json(results.slice(0, 25));
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json([]);
  }
}
