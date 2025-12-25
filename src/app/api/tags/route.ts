import { NextResponse } from "next/server";
import { db, tags } from "@/lib/db";
import { asc } from "drizzle-orm";

export async function GET() {
  const allTags = await db.query.tags.findMany({
    orderBy: [asc(tags.name)],
  });
  return NextResponse.json(allTags);
}
