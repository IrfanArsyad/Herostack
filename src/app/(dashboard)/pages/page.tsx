import { db, pages } from "@/lib/db";
import { desc } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { QuickCreatePage } from "@/components/quick-create";
import { PagesList } from "./pages-list";

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
        <PagesList
          pages={allPages.map((page) => ({
            id: page.id,
            name: page.name,
            slug: page.slug,
            draft: page.draft,
            updatedAt: page.updatedAt,
            book: page.book ? { name: page.book.name } : null,
          }))}
        />
      )}
    </div>
  );
}
