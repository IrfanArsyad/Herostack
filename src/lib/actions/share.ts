"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { requirePermission } from "@/lib/rbac";

export async function togglePublicShare(pageId: string) {
  const { authorized, error } = await requirePermission("pages:edit");
  if (!authorized) {
    return { error };
  }

  try {
    const page = await db.query.pages.findFirst({
      where: eq(pages.id, pageId),
    });

    if (!page) {
      return { error: "Page not found" };
    }

    const newIsPublic = !page.isPublic;
    let shareToken = page.shareToken;

    // Generate token if enabling public and no token exists
    if (newIsPublic && !shareToken) {
      shareToken = nanoid(16);
    }

    const [updated] = await db
      .update(pages)
      .set({
        isPublic: newIsPublic,
        shareToken,
        updatedAt: new Date(),
      })
      .where(eq(pages.id, pageId))
      .returning();

    revalidatePath(`/pages/${updated.slug}`);

    return {
      success: true,
      isPublic: updated.isPublic,
      shareToken: updated.shareToken,
      shareUrl: updated.isPublic ? `/share/${updated.shareToken}` : null,
    };
  } catch (err) {
    console.error("Error toggling public share:", err);
    return { error: "Failed to update sharing settings" };
  }
}

export async function regenerateShareToken(pageId: string) {
  const { authorized, error } = await requirePermission("pages:edit");
  if (!authorized) {
    return { error };
  }

  try {
    const page = await db.query.pages.findFirst({
      where: eq(pages.id, pageId),
    });

    if (!page) {
      return { error: "Page not found" };
    }

    const newToken = nanoid(16);

    const [updated] = await db
      .update(pages)
      .set({
        shareToken: newToken,
        updatedAt: new Date(),
      })
      .where(eq(pages.id, pageId))
      .returning();

    revalidatePath(`/pages/${updated.slug}`);

    return {
      success: true,
      shareToken: updated.shareToken,
      shareUrl: updated.isPublic ? `/share/${updated.shareToken}` : null,
    };
  } catch (err) {
    console.error("Error regenerating share token:", err);
    return { error: "Failed to regenerate share link" };
  }
}

export async function getPageShareInfo(pageId: string) {
  const page = await db.query.pages.findFirst({
    where: eq(pages.id, pageId),
    columns: {
      id: true,
      isPublic: true,
      shareToken: true,
      slug: true,
    },
  });

  if (!page) {
    return null;
  }

  return {
    isPublic: page.isPublic,
    shareToken: page.shareToken,
    shareUrl: page.isPublic && page.shareToken ? `/share/${page.shareToken}` : null,
  };
}

export async function getPublicPage(shareToken: string) {
  const page = await db.query.pages.findFirst({
    where: eq(pages.shareToken, shareToken),
    with: {
      book: true,
      createdByUser: {
        columns: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  if (!page || !page.isPublic) {
    return null;
  }

  return page;
}
