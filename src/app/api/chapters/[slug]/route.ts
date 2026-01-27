import { NextResponse } from "next/server";
import { db, chapters } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getUserTeamIds } from "@/lib/permissions";
import { isAdmin } from "@/lib/rbac";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  const chapter = await db.query.chapters.findFirst({
    where: eq(chapters.slug, slug),
    with: {
      book: {
        columns: { id: true, name: true, slug: true, teamId: true, createdBy: true },
      },
    },
  });

  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  // Check access via book ownership
  const hasAccess = await (async () => {
    // Personal book created by user
    if (!chapter.book.teamId && chapter.book.createdBy === session.user.id) {
      return true;
    }
    // Team book - check membership
    if (chapter.book.teamId) {
      const teamIds = await getUserTeamIds(session.user.id);
      return teamIds.includes(chapter.book.teamId);
    }
    // Admin/superadmin can access all
    if (isAdmin(session.user.role)) {
      return true;
    }
    return false;
  })();

  if (!hasAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  return NextResponse.json(chapter);
}
