import { db, tags, taggables } from "@/lib/db";
import { desc, eq, sql } from "drizzle-orm";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Tags, Hash, Library, BookMarked, FileText, Layers } from "lucide-react";
import Link from "next/link";

async function getTagsWithCounts() {
  const allTags = await db.query.tags.findMany({
    orderBy: [desc(tags.createdAt)],
  });

  const tagsWithCounts = await Promise.all(
    allTags.map(async (tag) => {
      const counts = await db
        .select({
          type: taggables.taggableType,
          count: sql<number>`count(*)::int`,
        })
        .from(taggables)
        .where(eq(taggables.tagId, tag.id))
        .groupBy(taggables.taggableType);

      const countMap: Record<string, number> = {};
      counts.forEach((c) => {
        countMap[c.type] = c.count;
      });

      return {
        ...tag,
        counts: countMap,
        total: counts.reduce((acc, c) => acc + c.count, 0),
      };
    })
  );

  return tagsWithCounts;
}

export default async function TagsPage() {
  const allTags = await getTagsWithCounts();

  return (
    <>
      <Header breadcrumbs={[{ label: "Tags" }]} />
      <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tags</h1>
            <p className="text-muted-foreground mt-1">
              Browse content by tags
            </p>
          </div>
        </div>

        {allTags.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Tags className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tags yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Tags will appear here when you add them to content.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allTags.map((tag) => (
              <Link key={tag.id} href={`/tags/${tag.slug}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-primary/10">
                        <Hash className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{tag.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {tag.total} {tag.total === 1 ? "item" : "items"}
                        </p>
                        {tag.total > 0 && (
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            {tag.counts.shelf && (
                              <span className="flex items-center gap-1">
                                <Library className="h-3 w-3" />
                                {tag.counts.shelf}
                              </span>
                            )}
                            {tag.counts.book && (
                              <span className="flex items-center gap-1">
                                <BookMarked className="h-3 w-3" />
                                {tag.counts.book}
                              </span>
                            )}
                            {tag.counts.chapter && (
                              <span className="flex items-center gap-1">
                                <Layers className="h-3 w-3" />
                                {tag.counts.chapter}
                              </span>
                            )}
                            {tag.counts.page && (
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {tag.counts.page}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
