import { NextResponse } from "next/server";
import { db, books } from "@/lib/db";
import { asc } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allBooks = await db.query.books.findMany({
    orderBy: [asc(books.name)],
  });

  return NextResponse.json(allBooks);
}
