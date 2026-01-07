"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { pages, books, shelves } from "@/lib/db/schema";
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

// ============ BOOK SHARE ACTIONS ============

export async function toggleBookPublicShare(bookId: string) {
  const { authorized, error } = await requirePermission("books:edit");
  if (!authorized) {
    return { error };
  }

  try {
    const book = await db.query.books.findFirst({
      where: eq(books.id, bookId),
    });

    if (!book) {
      return { error: "Book not found" };
    }

    const newIsPublic = !book.isPublic;
    let shareToken = book.shareToken;

    if (newIsPublic && !shareToken) {
      shareToken = nanoid(16);
    }

    const [updated] = await db
      .update(books)
      .set({
        isPublic: newIsPublic,
        shareToken,
        updatedAt: new Date(),
      })
      .where(eq(books.id, bookId))
      .returning();

    revalidatePath(`/books/${updated.slug}`);
    revalidatePath("/books");

    return {
      success: true,
      isPublic: updated.isPublic,
      shareToken: updated.shareToken,
      shareUrl: updated.isPublic ? `/share/book/${updated.shareToken}` : null,
    };
  } catch (err) {
    console.error("Error toggling book public share:", err);
    return { error: "Failed to update sharing settings" };
  }
}

export async function getBookShareInfo(bookId: string) {
  const book = await db.query.books.findFirst({
    where: eq(books.id, bookId),
    columns: {
      id: true,
      isPublic: true,
      shareToken: true,
      slug: true,
    },
  });

  if (!book) {
    return null;
  }

  return {
    isPublic: book.isPublic,
    shareToken: book.shareToken,
    shareUrl: book.isPublic && book.shareToken ? `/share/book/${book.shareToken}` : null,
  };
}

export async function getPublicBook(shareToken: string) {
  const book = await db.query.books.findFirst({
    where: eq(books.shareToken, shareToken),
    with: {
      shelf: true,
      chapters: {
        with: {
          pages: true,
        },
        orderBy: (chapters, { asc }) => [asc(chapters.sortOrder)],
      },
      pages: {
        orderBy: (pages, { asc }) => [asc(pages.sortOrder)],
      },
      createdByUser: {
        columns: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  if (!book || !book.isPublic) {
    return null;
  }

  return book;
}

// ============ SHELF SHARE ACTIONS ============

export async function toggleShelfPublicShare(shelfId: string) {
  const { authorized, error } = await requirePermission("shelves:edit");
  if (!authorized) {
    return { error };
  }

  try {
    const shelf = await db.query.shelves.findFirst({
      where: eq(shelves.id, shelfId),
    });

    if (!shelf) {
      return { error: "Shelf not found" };
    }

    const newIsPublic = !shelf.isPublic;
    let shareToken = shelf.shareToken;

    if (newIsPublic && !shareToken) {
      shareToken = nanoid(16);
    }

    const [updated] = await db
      .update(shelves)
      .set({
        isPublic: newIsPublic,
        shareToken,
        updatedAt: new Date(),
      })
      .where(eq(shelves.id, shelfId))
      .returning();

    revalidatePath(`/shelves/${updated.slug}`);
    revalidatePath("/shelves");

    return {
      success: true,
      isPublic: updated.isPublic,
      shareToken: updated.shareToken,
      shareUrl: updated.isPublic ? `/share/shelf/${updated.shareToken}` : null,
    };
  } catch (err) {
    console.error("Error toggling shelf public share:", err);
    return { error: "Failed to update sharing settings" };
  }
}

export async function getShelfShareInfo(shelfId: string) {
  const shelf = await db.query.shelves.findFirst({
    where: eq(shelves.id, shelfId),
    columns: {
      id: true,
      isPublic: true,
      shareToken: true,
      slug: true,
    },
  });

  if (!shelf) {
    return null;
  }

  return {
    isPublic: shelf.isPublic,
    shareToken: shelf.shareToken,
    shareUrl: shelf.isPublic && shelf.shareToken ? `/share/shelf/${shelf.shareToken}` : null,
  };
}

export async function getPublicShelf(shareToken: string) {
  const shelf = await db.query.shelves.findFirst({
    where: eq(shelves.shareToken, shareToken),
    with: {
      books: {
        with: {
          chapters: true,
          pages: true,
        },
        orderBy: (books, { asc }) => [asc(books.sortOrder)],
      },
      createdByUser: {
        columns: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  if (!shelf || !shelf.isPublic) {
    return null;
  }

  return shelf;
}
