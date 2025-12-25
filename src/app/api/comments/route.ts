import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comments, pages } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pageId = searchParams.get("pageId");

  if (!pageId) {
    return NextResponse.json({ error: "pageId is required" }, { status: 400 });
  }

  try {
    const allComments = await db.query.comments.findMany({
      where: eq(comments.pageId, pageId),
      orderBy: [asc(comments.createdAt)],
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Organize into threads
    const parentComments = allComments.filter((c) => !c.parentId);
    const replies = allComments.filter((c) => c.parentId);

    const threaded = parentComments.map((parent) => ({
      ...parent,
      replies: replies.filter((r) => r.parentId === parent.id),
    }));

    return NextResponse.json(threaded);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { pageId, content, parentId } = body;

    if (!pageId || !content?.trim()) {
      return NextResponse.json(
        { error: "pageId and content are required" },
        { status: 400 }
      );
    }

    // Verify page exists
    const page = await db.query.pages.findFirst({
      where: eq(pages.id, pageId),
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const [comment] = await db
      .insert(comments)
      .values({
        pageId,
        userId: session.user.id,
        content: content.trim(),
        parentId: parentId || null,
      })
      .returning();

    // Fetch with user data
    const commentWithUser = await db.query.comments.findFirst({
      where: eq(comments.id, comment.id),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(commentWithUser, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
