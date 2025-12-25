import { NextResponse } from "next/server";
import { db, pages } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const page = await db.query.pages.findFirst({
    where: eq(pages.slug, slug),
    with: {
      revisions: {
        orderBy: (revisions, { desc }) => [desc(revisions.revisionNumber)],
        with: {
          createdByUser: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: page.id,
    name: page.name,
    slug: page.slug,
    revisions: page.revisions,
  });
}
