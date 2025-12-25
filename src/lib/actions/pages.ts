"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { db, pages, revisions } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import slugify from "slugify";
import { nanoid } from "nanoid";
import { requirePermission } from "@/lib/rbac";

export async function createPage(formData: FormData) {
  const { authorized, session, error } = await requirePermission("pages:create");
  if (!authorized) {
    return { error };
  }

  const name = formData.get("name") as string;
  const content = formData.get("content") as string;
  const html = formData.get("html") as string;
  const bookId = formData.get("bookId") as string;
  const chapterId = formData.get("chapterId") as string;
  const draft = formData.get("draft") === "true";

  if (!name) {
    return { error: "Name is required" };
  }

  const baseSlug = slugify(name, { lower: true, strict: true });
  const slug = `${baseSlug}-${nanoid(6)}`;

  try {
    const [page] = await db
      .insert(pages)
      .values({
        name,
        slug,
        content,
        html,
        bookId: bookId || null,
        chapterId: chapterId || null,
        draft,
        createdBy: session!.user.id,
      })
      .returning();

    // Create initial revision
    await db.insert(revisions).values({
      pageId: page.id,
      content: content || "",
      html,
      revisionNumber: 1,
      createdBy: session!.user.id,
    });

    revalidatePath("/pages");
    revalidatePath("/books");
    redirect(`/pages/${page.slug}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Error creating page:", error);
    return { error: "Failed to create page" };
  }
}

export async function updatePage(id: string, formData: FormData) {
  const { authorized, session, error } = await requirePermission("pages:edit");
  if (!authorized) {
    return { error };
  }

  const name = formData.get("name") as string;
  const content = formData.get("content") as string;
  const html = formData.get("html") as string;
  const draft = formData.get("draft") === "true";

  if (!name) {
    return { error: "Name is required" };
  }

  try {
    // Get current revision number
    const lastRevision = await db.query.revisions.findFirst({
      where: eq(revisions.pageId, id),
      orderBy: [desc(revisions.revisionNumber)],
    });

    const newRevisionNumber = (lastRevision?.revisionNumber || 0) + 1;

    // Update page
    const [page] = await db
      .update(pages)
      .set({
        name,
        content,
        html,
        draft,
        updatedAt: new Date(),
      })
      .where(eq(pages.id, id))
      .returning();

    // Create new revision
    await db.insert(revisions).values({
      pageId: id,
      content: content || "",
      html,
      revisionNumber: newRevisionNumber,
      createdBy: session!.user.id,
    });

    revalidatePath("/pages");
    revalidatePath(`/pages/${page.slug}`);
    revalidatePath("/books");

    return { success: true, slug: page.slug };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Error updating page:", error);
    return { error: "Failed to update page" };
  }
}

export async function deletePage(id: string) {
  const { authorized, error } = await requirePermission("pages:delete");
  if (!authorized) {
    return { error };
  }

  try {
    await db.delete(pages).where(eq(pages.id, id));
    revalidatePath("/pages");
    revalidatePath("/books");
    redirect("/pages");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Error deleting page:", error);
    return { error: "Failed to delete page" };
  }
}
