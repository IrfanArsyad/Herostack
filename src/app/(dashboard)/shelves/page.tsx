import Link from "next/link";
import { db, shelves } from "@/lib/db";
import { desc } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Library, BookMarked, Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickCreateShelf } from "@/components/quick-create";

async function getShelves() {
  return db.query.shelves.findMany({
    orderBy: [desc(shelves.createdAt)],
    with: { books: true },
  });
}

export default async function ShelvesPage() {
  const allShelves = await getShelves();

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Shelves</h1>
        <QuickCreateShelf />
      </div>

      {allShelves.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Library className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No shelves yet</p>
            <QuickCreateShelf />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {allShelves.map((shelf) => (
            <Card key={shelf.id} className="hover:bg-muted/50 transition-colors group">
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded">
                  <Library className="h-4 w-4 text-purple-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{shelf.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <BookMarked className="h-3 w-3" />
                    {shelf.books.length} book{shelf.books.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                    <Link href={`/shelves/${shelf.slug}`}>
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                    <Link href={`/shelves/${shelf.slug}/edit`}>
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
