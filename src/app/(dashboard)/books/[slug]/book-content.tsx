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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileText, FolderOpen, Plus, Eye, Pencil, Globe, UserCircle } from "lucide-react";
import { SortableList } from "@/components/sortable-list";
import { QuickCreatePage } from "@/components/quick-create";
import { format } from "date-fns";

interface Page {
  id: string;
  name: string;
  slug: string;
  draft: boolean;
  isPublic?: boolean;
  chapterId: string | null;
  createdBy?: string | null;
  createdAt?: Date;
  createdByUser?: { id: string; name: string | null; image: string | null } | null;
}

interface Chapter {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  pages: Page[];
}

interface BookContentProps {
  bookId: string;
  chapters: Chapter[];
  directPages: Page[];
  isSuperAdmin?: boolean;
}

function ChapterCard({
  chapter,
  bookId,
  isSuperAdmin,
}: {
  chapter: Chapter;
  bookId: string;
  isSuperAdmin?: boolean;
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
              renderItem={(page) => <PageItem page={page} isSuperAdmin={isSuperAdmin} />}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function PageItem({ page, isSuperAdmin }: { page: Page; isSuperAdmin?: boolean }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors group">
      <FileText className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1">{page.name}</span>
      {page.isPublic && (
        <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
          <Globe className="h-3 w-3" />
          Public
        </Badge>
      )}
      {page.draft && (
        <Badge variant="outline" className="text-xs">
          Draft
        </Badge>
      )}
      {isSuperAdmin && page.createdByUser && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="p-1 rounded-full bg-muted hover:bg-muted/80 cursor-help shrink-0">
              <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            <div className="font-medium">{page.createdByUser.name || "Unknown"}</div>
            {page.createdAt && (
              <div className="text-muted-foreground">
                {format(new Date(page.createdAt), "MMM d, yyyy")}
              </div>
            )}
          </TooltipContent>
        </Tooltip>
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

export function BookContent({ bookId, chapters, directPages, isSuperAdmin }: BookContentProps) {
  return (
    <div className="space-y-4">
      {/* Chapters with drag-drop */}
      {chapters.length > 0 && (
        <SortableList
          items={chapters}
          type="chapters"
          renderItem={(chapter) => (
            <ChapterCard chapter={chapter} bookId={bookId} isSuperAdmin={isSuperAdmin} />
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
              renderItem={(page) => <PageItem page={page} isSuperAdmin={isSuperAdmin} />}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
