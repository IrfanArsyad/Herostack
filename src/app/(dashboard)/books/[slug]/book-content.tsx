"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, FolderOpen, Plus, Eye, Pencil } from "lucide-react";
import { SortableList } from "@/components/sortable-list";
import { QuickCreatePage } from "@/components/quick-create";

interface Chapter {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  pages: Page[];
}

interface Page {
  id: string;
  name: string;
  slug: string;
  draft: boolean;
  chapterId: string | null;
}

interface BookContentProps {
  bookId: string;
  chapters: Chapter[];
  directPages: Page[];
}

function ChapterCard({
  chapter,
  bookId,
}: {
  chapter: Chapter;
  bookId: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-5 w-5 text-amber-500" />
            <div>
              <CardTitle className="text-lg">
                <Link
                  href={`/chapters/${chapter.slug}`}
                  className="hover:underline"
                >
                  {chapter.name}
                </Link>
              </CardTitle>
              {chapter.description && (
                <CardDescription>{chapter.description}</CardDescription>
              )}
            </div>
          </div>
          <QuickCreatePage
            defaultBookId={bookId}
            defaultChapterId={chapter.id}
            trigger={
              <Button variant="ghost" size="sm">
                <Plus className="mr-1 h-3 w-3" />
                Add Page
              </Button>
            }
          />
        </div>
      </CardHeader>
      {chapter.pages.length > 0 && (
        <CardContent className="pt-2">
          <div className="ml-8">
            <SortableList
              items={chapter.pages}
              type="pages"
              renderItem={(page) => <PageItem page={page} />}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function PageItem({ page }: { page: Page }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors group">
      <FileText className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1">{page.name}</span>
      {page.draft && (
        <Badge variant="outline" className="text-xs">
          Draft
        </Badge>
      )}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
          <Link href={`/pages/${page.slug}`}>
            <Eye className="h-3.5 w-3.5 mr-1" />
            Read
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
          <Link href={`/pages/${page.slug}/edit`}>
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Edit
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function BookContent({ bookId, chapters, directPages }: BookContentProps) {
  return (
    <div className="space-y-4">
      {/* Chapters with drag-drop */}
      {chapters.length > 0 && (
        <SortableList
          items={chapters}
          type="chapters"
          renderItem={(chapter) => (
            <ChapterCard chapter={chapter} bookId={bookId} />
          )}
        />
      )}

      {/* Direct Pages (without chapter) */}
      {directPages.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Pages
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <SortableList
              items={directPages}
              type="pages"
              renderItem={(page) => <PageItem page={page} />}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
