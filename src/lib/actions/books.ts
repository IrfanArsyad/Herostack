"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { db, books } from "@/lib/db";
import { eq } from "drizzle-orm";
import slugify from "slugify";
import { nanoid } from "nanoid";
import { requirePermission } from "@/lib/rbac";

export async function createBook(formData: FormData) {
  const { authorized, session, error } = await requirePermission("books:create");
  if (!authorized) {
    return { error };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const shelfId = formData.get("shelfId") as string;
  const teamId = formData.get("teamId") as string | null;

  if (!name) {
    return { error: "Name is required" };
  }

  const baseSlug = slugify(name, { lower: true, strict: true });
  const slug = `${baseSlug}-${nanoid(6)}`;

  try {
    const [book] = await db
      .insert(books)
      .values({
        name,
        slug,
        description,
        shelfId: shelfId || null,
        teamId: teamId || null,
        createdBy: session!.user.id,
      })
      .returning();

    revalidatePath("/books");
    if (shelfId) {
      revalidatePath(`/shelves`);
    }
    redirect(`/books/${book.slug}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Error creating book:", error);
    return { error: "Failed to create book" };
  }
}

export async function updateBook(id: string, formData: FormData) {
  const { authorized, error } = await requirePermission("books:edit");
  if (!authorized) {
    return { error };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const shelfId = formData.get("shelfId") as string;
  const teamId = formData.get("teamId") as string | null;

  if (!name) {
    return { error: "Name is required" };
  }

  try {
    const [book] = await db
      .update(books)
      .set({
        name,
        description,
        shelfId: shelfId || null,
        teamId: teamId || null,
        updatedAt: new Date(),
      })
      .where(eq(books.id, id))
      .returning();

    revalidatePath("/books");
    revalidatePath(`/books/${book.slug}`);
    revalidatePath("/shelves");
    redirect(`/books/${book.slug}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Error updating book:", error);
    return { error: "Failed to update book" };
  }
}

export async function deleteBook(id: string) {
  const { authorized, error } = await requirePermission("books:delete");
  if (!authorized) {
    return { error };
  }

  try {
    await db.delete(books).where(eq(books.id, id));
    revalidatePath("/books");
    revalidatePath("/shelves");
    redirect("/books");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Error deleting book:", error);
    return { error: "Failed to delete book" };
  }
}
