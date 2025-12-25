import { NextResponse } from "next/server";
import { db, shelves } from "@/lib/db";
import { asc } from "drizzle-orm";

export async function GET() {
  const allShelves = await db.query.shelves.findMany({
    orderBy: [asc(shelves.name)],
  });

  return NextResponse.json(allShelves);
}
