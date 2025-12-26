import { NextResponse } from "next/server";
import { db, books } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getUserTeamIds } from "@/lib/permissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  const book = await db.query.books.findFirst({
    where: eq(books.slug, slug),
    with: {
      team: {
        columns: { id: true, name: true },
      },
    },
  });

  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  // Check access
  const hasAccess = await (async () => {
    // Personal book created by user
    if (!book.teamId && book.createdBy === session.user.id) {
      return true;
    }
    // Team book - check membership
    if (book.teamId) {
      const teamIds = await getUserTeamIds(session.user.id);
      return teamIds.includes(book.teamId);
    }
    // Admin can access all
    if (session.user.role === "admin") {
      return true;
    }
    return false;
  })();

  if (!hasAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  return NextResponse.json(book);
}
