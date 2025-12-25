"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { db, chapters, books } from "@/lib/db";
import { eq } from "drizzle-orm";
import slugify from "slugify";
import { nanoid } from "nanoid";
import { requirePermission } from "@/lib/rbac";

export async function createChapter(formData: FormData) {
  const { authorized, session, error } = await requirePermission("chapters:create");
  if (!authorized) {
    return { error };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const bookId = formData.get("bookId") as string;

  if (!name || !bookId) {
    return { error: "Name and book are required" };
  }

  const baseSlug = slugify(name, { lower: true, strict: true });
  const slug = `${baseSlug}-${nanoid(6)}`;

  try {
    const [chapter] = await db
      .insert(chapters)
      .values({
        name,
        slug,
        description,
        bookId,
        createdBy: session!.user.id,
      })
      .returning();

    // Get book slug for revalidation
    const book = await db.query.books.findFirst({
      where: eq(books.id, bookId),
    });

    revalidatePath("/books");
    if (book) {
      revalidatePath(`/books/${book.slug}`);
    }
    redirect(`/chapters/${chapter.slug}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Error creating chapter:", error);
    return { error: "Failed to create chapter" };
  }
}

export async function updateChapter(id: string, formData: FormData) {
  const { authorized, error } = await requirePermission("chapters:edit");
  if (!authorized) {
    return { error };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name) {
    return { error: "Name is required" };
  }

  try {
    const [chapter] = await db
      .update(chapters)
      .set({
        name,
        description,
        updatedAt: new Date(),
      })
      .where(eq(chapters.id, id))
      .returning();

    revalidatePath("/books");
    revalidatePath(`/chapters/${chapter.slug}`);
    redirect(`/chapters/${chapter.slug}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Error updating chapter:", error);
    return { error: "Failed to update chapter" };
  }
}

export async function deleteChapter(id: string, bookSlug: string) {
  const { authorized, error } = await requirePermission("chapters:delete");
  if (!authorized) {
    return { error };
  }

  try {
    await db.delete(chapters).where(eq(chapters.id, id));
    revalidatePath("/books");
    revalidatePath(`/books/${bookSlug}`);
    redirect(`/books/${bookSlug}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Error deleting chapter:", error);
    return { error: "Failed to delete chapter" };
  }
}
