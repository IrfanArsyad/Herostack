import { db, tags, taggables, shelves, books, chapters, pages } from "@/lib/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Library, BookMarked, Layers, FileText, Hash, Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface TaggedItem {
  id: string;
  name: string;
  type: string;
  slug: string;
  description?: string | null;
}

async function getTagWithItems(slug: string) {
  const tag = await db.query.tags.findFirst({
    where: eq(tags.slug, slug),
  });

  if (!tag) return null;

  const taggedItems = await db
    .select({
      taggableId: taggables.taggableId,
      taggableType: taggables.taggableType,
    })
    .from(taggables)
    .where(eq(taggables.tagId, tag.id));

  const items: TaggedItem[] = [];

  for (const item of taggedItems) {
    if (item.taggableType === "shelf") {
      const shelf = await db.query.shelves.findFirst({
        where: eq(shelves.id, item.taggableId),
      });
      if (shelf) {
        items.push({
          id: shelf.id,
          name: shelf.name,
          type: "shelf",
          slug: shelf.slug,
          description: shelf.description,
        });
      }
    } else if (item.taggableType === "book") {
      const book = await db.query.books.findFirst({
        where: eq(books.id, item.taggableId),
      });
      if (book) {
        items.push({
          id: book.id,
          name: book.name,
          type: "book",
          slug: book.slug,
          description: book.description,
        });
      }
    } else if (item.taggableType === "chapter") {
      const chapter = await db.query.chapters.findFirst({
        where: eq(chapters.id, item.taggableId),
      });
      if (chapter) {
        items.push({
          id: chapter.id,
          name: chapter.name,
          type: "chapter",
          slug: chapter.slug,
          description: chapter.description,
        });
      }
    } else if (item.taggableType === "page") {
      const page = await db.query.pages.findFirst({
        where: eq(pages.id, item.taggableId),
      });
      if (page) {
        items.push({
          id: page.id,
          name: page.name,
          type: "page",
          slug: page.slug,
        });
      }
    }
  }

  return { tag, items };
}

function getTypeIcon(type: string) {
  switch (type) {
    case "shelf":
      return <Library className="h-4 w-4" />;
    case "book":
      return <BookMarked className="h-4 w-4" />;
    case "chapter":
      return <Layers className="h-4 w-4" />;
    case "page":
      return <FileText className="h-4 w-4" />;
    default:
      return null;
  }
}

function getTypeLabel(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function getItemLink(item: TaggedItem) {
  switch (item.type) {
    case "shelf":
      return `/shelves/${item.slug}`;
    case "book":
      return `/books/${item.slug}`;
    case "chapter":
      return `/books/${item.slug}`;
    case "page":
      return `/pages/${item.slug}`;
    default:
      return "#";
  }
}

export default async function TagDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getTagWithItems(slug);

  if (!data) {
    notFound();
  }

  const { tag, items } = data;

  // Group items by type
  const groupedItems = items.reduce(
    (acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = [];
      }
      acc[item.type].push(item);
      return acc;
    },
    {} as Record<string, TaggedItem[]>
  );

  const typeOrder = ["shelf", "book", "chapter", "page"];

  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Tags", href: "/tags" },
          { label: tag.name },
        ]}
      />
      <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <Hash className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{tag.name}</h1>
            <p className="text-muted-foreground mt-1">
              {items.length} {items.length === 1 ? "item" : "items"} with this tag
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Hash className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No items</h3>
              <p className="text-muted-foreground text-center">
                No content is tagged with &quot;{tag.name}&quot; yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {typeOrder.map((type) => {
              const typeItems = groupedItems[type];
              if (!typeItems || typeItems.length === 0) return null;

              return (
                <div key={type}>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    {getTypeIcon(type)}
                    {getTypeLabel(type)}s
                    <Badge variant="secondary" className="ml-1">
                      {typeItems.length}
                    </Badge>
                  </h2>
                  <div className="grid gap-3">
                    {typeItems.map((item) => (
                      <Card key={item.id} className="hover:bg-muted/50 transition-colors group">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-muted">
                              {getTypeIcon(item.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">
                                {item.name}
                              </h3>
                              {item.description && (
                                <p className="text-sm text-muted-foreground truncate mt-0.5">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            {item.type === "page" ? (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                                  <Link href={`/pages/${item.slug}`}>
                                    <Eye className="h-3.5 w-3.5 mr-1" />
                                    Read
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                                  <Link href={`/pages/${item.slug}/edit`}>
                                    <Pencil className="h-3.5 w-3.5 mr-1" />
                                    Edit
                                  </Link>
                                </Button>
                              </div>
                            ) : (
                              <Button variant="ghost" size="sm" className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                                <Link href={getItemLink(item)}>
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  View
                                </Link>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
