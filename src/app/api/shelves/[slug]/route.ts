import { NextResponse } from "next/server";
import { db, shelves } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const shelf = await db.query.shelves.findFirst({
    where: eq(shelves.slug, slug),
  });

  if (!shelf) {
    return NextResponse.json({ error: "Shelf not found" }, { status: 404 });
  }

  return NextResponse.json(shelf);
}
