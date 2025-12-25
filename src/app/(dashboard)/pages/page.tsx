import Link from "next/link";
import { db, pages } from "@/lib/db";
import { desc } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { QuickCreatePage } from "@/components/quick-create";

async function getPages() {
  return db.query.pages.findMany({
    orderBy: [desc(pages.updatedAt)],
    with: { book: true },
  });
}

export default async function PagesPage() {
  const allPages = await getPages();

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pages</h1>
        <QuickCreatePage />
      </div>

      {allPages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No pages yet</p>
            <QuickCreatePage />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {allPages.map((page) => (
            <Link key={page.id} href={`/pages/${page.slug}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{page.name}</span>
                        {page.draft && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">Draft</Badge>
                        )}
                      </div>
                      {page.book && (
                        <div className="text-xs text-muted-foreground truncate">{page.book.name}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0 ml-4">
                    {formatDistanceToNow(new Date(page.updatedAt), { addSuffix: true })}
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
