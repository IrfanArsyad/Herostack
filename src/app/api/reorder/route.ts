import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, chapters, pages } from "@/lib/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, items } = await request.json();

    if (!type || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Update sort order for each item
    if (type === "chapters") {
      for (let i = 0; i < items.length; i++) {
        await db
          .update(chapters)
          .set({ sortOrder: i, updatedAt: new Date() })
          .where(eq(chapters.id, items[i]));
      }
    } else if (type === "pages") {
      for (let i = 0; i < items.length; i++) {
        await db
          .update(pages)
          .set({ sortOrder: i, updatedAt: new Date() })
          .where(eq(pages.id, items[i]));
      }
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    revalidatePath("/books");
    revalidatePath("/chapters");
    revalidatePath("/pages");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reorder error:", error);
    return NextResponse.json(
      { error: "Failed to reorder" },
      { status: 500 }
    );
  }
}
