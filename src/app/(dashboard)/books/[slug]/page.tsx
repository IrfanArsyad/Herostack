import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db, books } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getUserTeamIds } from "@/lib/permissions";
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
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  BookMarked,
  FileText,
  FolderOpen,
  BookOpen,
} from "lucide-react";
import { BookReaderModal } from "@/components/book-reader/book-reader-modal";
import { DeleteBookButton } from "./delete-button";
import { QuickCreateChapter, QuickCreatePage } from "@/components/quick-create";
import { BookContent } from "./book-content";
import { BookTags } from "./book-tags";
import { getTagsForEntity } from "@/lib/actions/tags";
import { BookExportButton } from "@/components/export/book-export-button";

interface BookPageProps {
  params: Promise<{ slug: string }>;
}

async function getBook(slug: string) {
  return db.query.books.findFirst({
    where: eq(books.slug, slug),
    with: {
      shelf: true,
      team: {
        columns: { id: true, name: true, slug: true },
      },
      chapters: {
        with: {
          pages: true,
        },
        orderBy: (chapters, { asc }) => [asc(chapters.sortOrder)],
      },
      pages: {
        orderBy: (pages, { asc }) => [asc(pages.sortOrder)],
      },
    },
  });
}

export default async function BookPage({ params }: BookPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { slug } = await params;
  const book = await getBook(slug);

  if (!book) {
    notFound();
  }

  // Check access: user must be creator (personal) or team member
  const hasAccess = await (async () => {
    // Personal book created by user
    if (!book.teamId && book.createdBy === session.user.id) {
      return true;
    }
    // Team book - check membership
    if (book.teamId) {
      const teamIds = await getUserTeamIds(session.user.id);
      return teamIds.includes(book.teamId);
    }
    // Admin can access all
    if (session.user.role === "admin") {
      return true;
    }
    return false;
  })();

  if (!hasAccess) {
    notFound();
  }

  const bookTags = await getTagsForEntity(book.id, "book");

  // Pages without chapters (direct pages)
  const directPages = book.pages.filter((p) => !p.chapterId);

  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Books", href: "/books" },
          ...(book.shelf
            ? [{ label: book.shelf.name, href: `/shelves/${book.shelf.slug}` }]
            : []),
          { label: book.name },
        ]}
      />
      <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <BookMarked className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{book.name}</h1>
                {book.shelf && (
                  <Badge variant="secondary">{book.shelf.name}</Badge>
                )}
              </div>
              {book.description && (
                <p className="text-muted-foreground mt-1">{book.description}</p>
              )}
              <div className="mt-2">
                <BookTags bookId={book.id} initialTags={bookTags} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BookReaderModal
              bookSlug={book.slug}
              trigger={
                <Button variant="secondary">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Read Book
                </Button>
              }
            />
            <QuickCreateChapter
              defaultBookId={book.id}
              trigger={
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Chapter
                </Button>
              }
            />
            <QuickCreatePage
              defaultBookId={book.id}
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Page
                </Button>
              }
            />
            <BookExportButton bookSlug={book.slug} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/books/${book.slug}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Book
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DeleteBookButton bookId={book.id} />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="space-y-4">
          {/* Chapters and Pages with drag-drop ordering */}
          {(book.chapters.length > 0 || directPages.length > 0) && (
            <BookContent
              bookId={book.id}
              chapters={book.chapters}
              directPages={directPages}
            />
          )}

          {/* Empty State */}
          {book.chapters.length === 0 && directPages.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No content yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Add chapters or pages to this book.
                </p>
                <div className="flex gap-2">
                  <QuickCreateChapter
                    defaultBookId={book.id}
                    trigger={
                      <Button variant="outline">Add Chapter</Button>
                    }
                  />
                  <QuickCreatePage
                    defaultBookId={book.id}
                    trigger={<Button>Add Page</Button>}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
