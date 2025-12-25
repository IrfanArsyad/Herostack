import { auth } from "@/lib/auth";
import { db, books, pages } from "@/lib/db";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, BookMarked, Clock, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { QuickCreateBook, QuickCreatePage } from "@/components/quick-create";

async function getRecentContent() {
  // Run queries in parallel for better performance
  const [recentBooks, recentPages] = await Promise.all([
    db.query.books.findMany({
      orderBy: [desc(books.updatedAt)],
      limit: 5,
      with: { shelf: true },
    }),
    db.query.pages.findMany({
      orderBy: [desc(pages.updatedAt)],
      limit: 8,
      with: { book: true },
    }),
  ]);

  return { recentBooks, recentPages };
}

export default async function DashboardPage() {
  const session = await auth();
  const { recentBooks, recentPages } = await getRecentContent();

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Hi, {session?.user?.name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground text-sm">
          Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">⌘K</kbd> to search or create
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-8">
        <QuickCreateBook />
        <QuickCreatePage />
      </div>

      {/* Recent Pages */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Pages
          </h2>
          <Link href="/pages" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {recentPages.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              No pages yet. Create your first page to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-2">
            {recentPages.map((page) => (
              <Link key={page.id} href={`/pages/${page.slug}`}>
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">{page.name}</div>
                        {page.book && (
                          <div className="text-xs text-muted-foreground">{page.book.name}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(page.updatedAt), { addSuffix: true })}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Books */}
      {recentBooks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookMarked className="h-4 w-4" />
              Recent Books
            </h2>
            <Link href="/books" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {recentBooks.map((book) => (
              <Link key={book.id} href={`/books/${book.slug}`}>
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardContent className="py-3 px-4 flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded">
                      <BookMarked className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{book.name}</div>
                      {book.shelf && (
                        <div className="text-xs text-muted-foreground">{book.shelf.name}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
