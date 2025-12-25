"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db, tags, taggables } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import slugify from "slugify";
import { nanoid } from "nanoid";

export async function createTag(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const name = formData.get("name") as string;

  if (!name) {
    return { error: "Name is required" };
  }

  const baseSlug = slugify(name, { lower: true, strict: true });
  const slug = `${baseSlug}-${nanoid(6)}`;

  try {
    const [tag] = await db
      .insert(tags)
      .values({ name, slug })
      .returning();

    revalidatePath("/tags");
    return { success: true, tag };
  } catch (error) {
    console.error("Error creating tag:", error);
    return { error: "Failed to create tag" };
  }
}

export async function deleteTag(tagId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    await db.delete(tags).where(eq(tags.id, tagId));
    revalidatePath("/tags");
    return { success: true };
  } catch (error) {
    console.error("Error deleting tag:", error);
    return { error: "Failed to delete tag" };
  }
}

export async function addTagToEntity(
  tagId: string,
  entityId: string,
  entityType: "shelf" | "book" | "chapter" | "page"
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    await db
      .insert(taggables)
      .values({
        tagId,
        taggableId: entityId,
        taggableType: entityType,
      })
      .onConflictDoNothing();

    revalidatePath("/tags");
    revalidatePath(`/${entityType}s`);
    return { success: true };
  } catch (error) {
    console.error("Error adding tag:", error);
    return { error: "Failed to add tag" };
  }
}

export async function removeTagFromEntity(
  tagId: string,
  entityId: string,
  entityType: "shelf" | "book" | "chapter" | "page"
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    await db
      .delete(taggables)
      .where(
        and(
          eq(taggables.tagId, tagId),
          eq(taggables.taggableId, entityId),
          eq(taggables.taggableType, entityType)
        )
      );

    revalidatePath("/tags");
    revalidatePath(`/${entityType}s`);
    return { success: true };
  } catch (error) {
    console.error("Error removing tag:", error);
    return { error: "Failed to remove tag" };
  }
}

export async function getTagsForEntity(
  entityId: string,
  entityType: "shelf" | "book" | "chapter" | "page"
) {
  const entityTags = await db.query.taggables.findMany({
    where: and(
      eq(taggables.taggableId, entityId),
      eq(taggables.taggableType, entityType)
    ),
    with: {
      tag: true,
    },
  });

  return entityTags.map((t) => t.tag);
}

export async function getAllTags() {
  return db.query.tags.findMany({
    orderBy: (tags, { asc }) => [asc(tags.name)],
  });
}
