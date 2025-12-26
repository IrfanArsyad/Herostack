import { NextResponse } from "next/server";
import { db, shelves } from "@/lib/db";
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

  const shelf = await db.query.shelves.findFirst({
    where: eq(shelves.slug, slug),
    with: {
      team: {
        columns: { id: true, name: true },
      },
    },
  });

  if (!shelf) {
    return NextResponse.json({ error: "Shelf not found" }, { status: 404 });
  }

  // Check access
  const hasAccess = await (async () => {
    // Personal shelf created by user
    if (!shelf.teamId && shelf.createdBy === session.user.id) {
      return true;
    }
    // Team shelf - check membership
    if (shelf.teamId) {
      const teamIds = await getUserTeamIds(session.user.id);
      return teamIds.includes(shelf.teamId);
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

  return NextResponse.json(shelf);
}
