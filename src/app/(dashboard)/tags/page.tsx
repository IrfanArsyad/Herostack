import { db, tags } from "@/lib/db";
import { desc } from "drizzle-orm";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tags, Plus } from "lucide-react";

async function getTags() {
  return db.query.tags.findMany({
    orderBy: [desc(tags.createdAt)],
  });
}

export default async function TagsPage() {
  const allTags = await getTags();

  return (
    <>
      <Header breadcrumbs={[{ label: "Tags" }]} />
      <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tags</h1>
            <p className="text-muted-foreground mt-1">
              Manage tags for your documentation
            </p>
          </div>
        </div>

        {allTags.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Tags className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tags yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Tags will appear here when you add them to pages.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <Badge key={tag.id} variant="secondary" className="text-sm py-1 px-3">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
