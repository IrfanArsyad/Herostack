import { notFound } from "next/navigation";
import Link from "next/link";
import { db, chapters } from "@/lib/db";
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
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  FileText,
  FolderOpen,
} from "lucide-react";
import { DeleteChapterButton } from "./delete-button";
import { ChapterTags } from "./chapter-tags";
import { getTagsForEntity } from "@/lib/actions/tags";
import { ExportMenuItems } from "@/components/export/export-menu-items";

interface ChapterPageProps {
  params: Promise<{ slug: string }>;
}

async function getChapter(slug: string) {
  return db.query.chapters.findFirst({
    where: eq(chapters.slug, slug),
    with: {
      book: {
        with: {
          shelf: true,
        },
      },
      pages: {
        orderBy: (pages, { asc }) => [asc(pages.sortOrder)],
      },
    },
  });
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { slug } = await params;
  const chapter = await getChapter(slug);

  if (!chapter) {
    notFound();
  }

  const chapterTags = await getTagsForEntity(chapter.id, "chapter");

  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Books", href: "/books" },
          { label: chapter.book.name, href: `/books/${chapter.book.slug}` },
          { label: chapter.name },
        ]}
      />
      <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-lg">
              <FolderOpen className="h-8 w-8 text-amber-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{chapter.name}</h1>
              {chapter.description && (
                <p className="text-muted-foreground mt-1">
                  {chapter.description}
                </p>
              )}
              <div className="mt-2">
                <ChapterTags chapterId={chapter.id} initialTags={chapterTags} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href={`/pages/new?chapter=${chapter.id}`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Page
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
                  <Link href={`/chapters/${chapter.slug}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Chapter
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <ExportMenuItems type="chapter" slug={chapter.slug} />
                <DropdownMenuSeparator />
                <DeleteChapterButton
                  chapterId={chapter.id}
                  bookSlug={chapter.book.slug}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {chapter.pages.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No pages yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Add your first page to this chapter.
              </p>
              <Button asChild>
                <Link href={`/pages/new?chapter=${chapter.id}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Page
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {chapter.pages.map((page) => (
              <Link key={page.id} href={`/pages/${page.slug}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer">
                  <CardHeader className="py-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{page.name}</CardTitle>
                        {page.draft && (
                          <Badge variant="outline" className="text-xs">
                            Draft
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
