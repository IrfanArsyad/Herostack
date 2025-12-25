"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { db, shelves } from "@/lib/db";
import { eq } from "drizzle-orm";
import slugify from "slugify";
import { nanoid } from "nanoid";
import { requirePermission } from "@/lib/rbac";

export async function createShelf(formData: FormData) {
  const { authorized, session, error } = await requirePermission("shelves:create");
  if (!authorized) {
    return { error };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name) {
    return { error: "Name is required" };
  }

  const baseSlug = slugify(name, { lower: true, strict: true });
  const slug = `${baseSlug}-${nanoid(6)}`;

  try {
    const [shelf] = await db
      .insert(shelves)
      .values({
        name,
        slug,
        description,
        createdBy: session!.user.id,
      })
      .returning();

    revalidatePath("/shelves");
    redirect(`/shelves/${shelf.slug}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Error creating shelf:", error);
    return { error: "Failed to create shelf" };
  }
}

export async function updateShelf(id: string, formData: FormData) {
  const { authorized, error } = await requirePermission("shelves:edit");
  if (!authorized) {
    return { error };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name) {
    return { error: "Name is required" };
  }

  try {
    const [shelf] = await db
      .update(shelves)
      .set({
        name,
        description,
        updatedAt: new Date(),
      })
      .where(eq(shelves.id, id))
      .returning();

    revalidatePath("/shelves");
    revalidatePath(`/shelves/${shelf.slug}`);
    redirect(`/shelves/${shelf.slug}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Error updating shelf:", error);
    return { error: "Failed to update shelf" };
  }
}

export async function deleteShelf(id: string) {
  const { authorized, error } = await requirePermission("shelves:delete");
  if (!authorized) {
    return { error };
  }

  try {
    await db.delete(shelves).where(eq(shelves.id, id));
    revalidatePath("/shelves");
    redirect("/shelves");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Error deleting shelf:", error);
    return { error: "Failed to delete shelf" };
  }
}
