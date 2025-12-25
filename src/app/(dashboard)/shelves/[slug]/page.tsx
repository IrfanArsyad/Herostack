import { notFound } from "next/navigation";
import Link from "next/link";
import { db, shelves } from "@/lib/db";
import { eq } from "drizzle-orm";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  BookMarked,
  Library,
} from "lucide-react";
import { DeleteShelfButton } from "./delete-button";
import { ShelfTags } from "./shelf-tags";
import { getTagsForEntity } from "@/lib/actions/tags";

interface ShelfPageProps {
  params: Promise<{ slug: string }>;
}

async function getShelf(slug: string) {
  return db.query.shelves.findFirst({
    where: eq(shelves.slug, slug),
    with: {
      books: {
        with: {
          chapters: true,
        },
      },
      createdByUser: true,
    },
  });
}

export default async function ShelfPage({ params }: ShelfPageProps) {
  const { slug } = await params;
  const shelf = await getShelf(slug);

  if (!shelf) {
    notFound();
  }

  const shelfTags = await getTagsForEntity(shelf.id, "shelf");

  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Shelves", href: "/shelves" },
          { label: shelf.name },
        ]}
      />
      <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Library className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{shelf.name}</h1>
              {shelf.description && (
                <p className="text-muted-foreground mt-1">
                  {shelf.description}
                </p>
              )}
              <div className="mt-2">
                <ShelfTags shelfId={shelf.id} initialTags={shelfTags} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href={`/books/new?shelf=${shelf.id}`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Book
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/shelves/${shelf.slug}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Shelf
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DeleteShelfButton shelfId={shelf.id} />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {shelf.books.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookMarked className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No books yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Add your first book to this shelf.
              </p>
              <Button asChild>
                <Link href={`/books/new?shelf=${shelf.id}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Book
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {shelf.books.map((book) => (
              <Link key={book.id} href={`/books/${book.slug}`}>
                <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-md">
                        <BookMarked className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{book.name}</CardTitle>
                        <CardDescription>
                          {book.chapters.length} chapter
                          {book.chapters.length !== 1 ? "s" : ""}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  {book.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {book.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
