import { NextResponse } from "next/server";
import { db, chapters } from "@/lib/db";
import { asc } from "drizzle-orm";

export async function GET() {
  const allChapters = await db.query.chapters.findMany({
    orderBy: [asc(chapters.name)],
  });

  return NextResponse.json(allChapters);
}
