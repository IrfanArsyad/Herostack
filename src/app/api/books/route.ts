import { NextResponse } from "next/server";
import { db, books } from "@/lib/db";
import { asc } from "drizzle-orm";

export async function GET() {
  const allBooks = await db.query.books.findMany({
    orderBy: [asc(books.name)],
  });

  return NextResponse.json(allBooks);
}
