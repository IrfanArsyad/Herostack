import { NextResponse } from "next/server";
import { db, shelves, books, chapters, pages } from "@/lib/db";
import { sql, ilike, or } from "drizzle-orm";

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const type = searchParams.get("type"); // Optional filter: shelf, book, chapter, page

  if (!query || query.trim().length < 2) {
    return NextResponse.json([]);
  }

  const searchTerms = query.trim().split(/\s+/).filter(t => t.length > 1);
  if (searchTerms.length === 0) {
    return NextResponse.json([]);
  }

  // Create PostgreSQL full-text search query
  const tsQuery = searchTerms.map(t => `${t}:*`).join(" & ");
  const searchPattern = `%${query}%`;

  try {
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

    // Sort all results by rank
    results.sort((a, b) => b.rank - a.rank);

    return NextResponse.json(results.slice(0, 25));
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json([]);
  }
}
