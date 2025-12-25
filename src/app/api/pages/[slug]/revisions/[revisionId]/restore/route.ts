import { NextResponse } from "next/server";
import { db, pages, revisions } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; revisionId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, revisionId } = await params;

  // Find the page
  const page = await db.query.pages.findFirst({
    where: eq(pages.slug, slug),
  });

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  // Find the revision
  const revision = await db.query.revisions.findFirst({
    where: and(
      eq(revisions.id, revisionId),
      eq(revisions.pageId, page.id)
    ),
  });

  if (!revision) {
    return NextResponse.json({ error: "Revision not found" }, { status: 404 });
  }

  // Get the latest revision number
  const latestRevision = await db.query.revisions.findFirst({
    where: eq(revisions.pageId, page.id),
    orderBy: (revisions, { desc }) => [desc(revisions.revisionNumber)],
  });

  const newRevisionNumber = (latestRevision?.revisionNumber || 0) + 1;

  // Create a new revision with the current content (before restoring)
  await db.insert(revisions).values({
    pageId: page.id,
    content: page.content || "",
    html: page.html,
    revisionNumber: newRevisionNumber,
    createdBy: session.user.id,
  });

  // Update the page with the restored content
  await db
    .update(pages)
    .set({
      content: revision.content,
      html: revision.html,
      updatedAt: new Date(),
    })
    .where(eq(pages.id, page.id));

  return NextResponse.json({ success: true });
}
