import { redirect } from "next/navigation";
import { db, books, shelves } from "@/lib/db";
import { desc, eq, or, inArray, isNull, and } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { BookMarked } from "lucide-react";
import { QuickCreateBook } from "@/components/quick-create";
import { BooksList } from "./books-list";
import { ImportBookDialog } from "@/components/import/import-book-dialog";
import { auth } from "@/lib/auth";
import { getUserTeamIds } from "@/lib/permissions";

async function getBooks(userId: string) {
  const teamIds = await getUserTeamIds(userId);

  // Get books that:
  // 1. User created personally (no team)
  // 2. Belong to teams the user is a member of
  const conditions = [and(isNull(books.teamId), eq(books.createdBy, userId))];

  if (teamIds.length > 0) {
    conditions.push(inArray(books.teamId, teamIds));
  }

  return db.query.books.findMany({
    where: or(...conditions),
    orderBy: [desc(books.createdAt)],
    with: {
      shelf: true,
      team: {
        columns: { id: true, name: true, slug: true },
      },
    },
  });
}

async function getShelves(userId: string) {
  const teamIds = await getUserTeamIds(userId);

  const conditions = [and(isNull(shelves.teamId), eq(shelves.createdBy, userId))];

  if (teamIds.length > 0) {
    conditions.push(inArray(shelves.teamId, teamIds));
  }

  return db.query.shelves.findMany({
    where: or(...conditions),
    orderBy: [desc(shelves.createdAt)],
  });
}

export default async function BooksPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [allBooks, allShelves] = await Promise.all([
    getBooks(session.user.id),
    getShelves(session.user.id),
  ]);

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Books</h1>
        <div className="flex items-center gap-2">
          <ImportBookDialog
            shelves={allShelves.map((s) => ({ id: s.id, name: s.name }))}
          />
          <QuickCreateBook />
        </div>
      </div>

      {allBooks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookMarked className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No books yet</p>
            <div className="flex items-center justify-center gap-2">
              <ImportBookDialog
                shelves={allShelves.map((s) => ({ id: s.id, name: s.name }))}
              />
              <QuickCreateBook />
            </div>
          </CardContent>
        </Card>
      ) : (
        <BooksList
          books={allBooks.map((book) => ({
            id: book.id,
            name: book.name,
            slug: book.slug,
            description: book.description,
            shelf: book.shelf ? { name: book.shelf.name } : null,
            team: book.team ? { name: book.team.name } : null,
          }))}
        />
      )}
    </div>
  );
}
