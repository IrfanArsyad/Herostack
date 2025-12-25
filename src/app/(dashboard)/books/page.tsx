import Link from "next/link";
import { db, books } from "@/lib/db";
import { desc } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { BookMarked } from "lucide-react";
import { QuickCreateBook } from "@/components/quick-create";

async function getBooks() {
  return db.query.books.findMany({
    orderBy: [desc(books.createdAt)],
    with: { shelf: true },
  });
}

export default async function BooksPage() {
  const allBooks = await getBooks();

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Books</h1>
        <QuickCreateBook />
      </div>

      {allBooks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookMarked className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No books yet</p>
            <QuickCreateBook />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {allBooks.map((book) => (
            <Link key={book.id} href={`/books/${book.slug}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded">
                    <BookMarked className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{book.name}</div>
                    {book.shelf && (
                      <div className="text-xs text-muted-foreground truncate">{book.shelf.name}</div>
                    )}
                    {book.description && !book.shelf && (
                      <div className="text-xs text-muted-foreground truncate">{book.description}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
