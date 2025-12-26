import { NextResponse } from "next/server";
import { db, pages } from "@/lib/db";
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

  const page = await db.query.pages.findFirst({
    where: eq(pages.slug, slug),
    with: {
      book: {
        with: {
          team: {
            columns: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  // Check access
  const hasAccess = await (async () => {
    // Page without a book - check if created by user
    if (!page.bookId && page.createdBy === session.user.id) {
      return true;
    }
    // Page in a book
    if (page.book) {
      // Personal book created by user
      if (!page.book.teamId && page.book.createdBy === session.user.id) {
        return true;
      }
      // Team book - check membership
      if (page.book.teamId) {
        const teamIds = await getUserTeamIds(session.user.id);
        return teamIds.includes(page.book.teamId);
      }
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

  return NextResponse.json(page);
}
