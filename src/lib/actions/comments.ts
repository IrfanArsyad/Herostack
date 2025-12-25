"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { comments, users, pages } from "@/lib/db/schema";
import { eq, desc, isNull, asc } from "drizzle-orm";
import { requireAuth } from "@/lib/rbac";

export async function getComments(pageId: string) {
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

  // Organize into threads (parent comments with their replies)
  const parentComments = allComments.filter((c) => !c.parentId);
  const replies = allComments.filter((c) => c.parentId);

  const threaded = parentComments.map((parent) => ({
    ...parent,
    replies: replies.filter((r) => r.parentId === parent.id),
  }));

  return threaded;
}

export async function createComment(formData: FormData) {
  const { authorized, session, error } = await requireAuth();
  if (!authorized || !session?.user?.id) {
    return { error: error || "Unauthorized" };
  }

  const pageId = formData.get("pageId") as string;
  const content = formData.get("content") as string;
  const parentId = formData.get("parentId") as string | null;

  if (!pageId || !content?.trim()) {
    return { error: "Page ID and content are required" };
  }

  // Verify page exists
  const page = await db.query.pages.findFirst({
    where: eq(pages.id, pageId),
  });

  if (!page) {
    return { error: "Page not found" };
  }

  try {
    const [comment] = await db
      .insert(comments)
      .values({
        pageId,
        userId: session.user.id,
        content: content.trim(),
        parentId: parentId || null,
      })
      .returning();

    revalidatePath(`/pages/${page.slug}`);
    return { success: true, comment };
  } catch (err) {
    console.error("Error creating comment:", err);
    return { error: "Failed to create comment" };
  }
}

export async function updateComment(commentId: string, formData: FormData) {
  const { authorized, session, error } = await requireAuth();
  if (!authorized || !session?.user?.id) {
    return { error: error || "Unauthorized" };
  }

  const content = formData.get("content") as string;

  if (!content?.trim()) {
    return { error: "Content is required" };
  }

  // Verify ownership
  const existingComment = await db.query.comments.findFirst({
    where: eq(comments.id, commentId),
    with: { page: true },
  });

  if (!existingComment) {
    return { error: "Comment not found" };
  }

  if (existingComment.userId !== session.user.id) {
    return { error: "You can only edit your own comments" };
  }

  try {
    const [updated] = await db
      .update(comments)
      .set({
        content: content.trim(),
        updatedAt: new Date(),
      })
      .where(eq(comments.id, commentId))
      .returning();

    if (existingComment.page) {
      revalidatePath(`/pages/${existingComment.page.slug}`);
    }
    return { success: true, comment: updated };
  } catch (err) {
    console.error("Error updating comment:", err);
    return { error: "Failed to update comment" };
  }
}

export async function deleteComment(commentId: string) {
  const { authorized, session, error } = await requireAuth();
  if (!authorized || !session?.user?.id) {
    return { error: error || "Unauthorized" };
  }

  // Verify ownership or admin
  const existingComment = await db.query.comments.findFirst({
    where: eq(comments.id, commentId),
    with: { page: true },
  });

  if (!existingComment) {
    return { error: "Comment not found" };
  }

  const isOwner = existingComment.userId === session.user.id;
  const isAdmin = session.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return { error: "You can only delete your own comments" };
  }

  try {
    // Delete replies first (cascade should handle this, but being explicit)
    await db.delete(comments).where(eq(comments.parentId, commentId));
    await db.delete(comments).where(eq(comments.id, commentId));

    if (existingComment.page) {
      revalidatePath(`/pages/${existingComment.page.slug}`);
    }
    return { success: true };
  } catch (err) {
    console.error("Error deleting comment:", err);
    return { error: "Failed to delete comment" };
  }
}
