"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, FileText, Clock, Loader2, ArrowLeft, Check, ChevronDown, ChevronRight } from "lucide-react";
import type { GeneratedBook } from "../types";
import { getBookStats } from "../lib/book-generator";

interface SummarizerPreviewProps {
  book: GeneratedBook;
  onBack: () => void;
}

export function SummarizerPreview({ book, onBack }: SummarizerPreviewProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());

  const stats = getBookStats(book);

  function toggleChapter(index: number) {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedChapters(newExpanded);
  }

  async function handleCreate() {
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/plugins/summarize/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create book");
      }

      const result = await response.json();
      router.push(`/books/${result.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {book.name}
              </CardTitle>
              <CardDescription className="mt-2">{book.description}</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <Badge variant="secondary">
                {stats.totalChapters} Chapters
              </Badge>
              <Badge variant="secondary">
                {stats.totalPages} Pages
              </Badge>
              <Badge variant="outline">
                <Clock className="mr-1 h-3 w-3" />
                {stats.estimatedReadTime} min read
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />
          <h4 className="text-sm font-medium mb-3">Book Structure Preview</h4>

          <div className="space-y-2">
            {book.chapters.map((chapter, chapterIndex) => (
              <div key={chapterIndex} className="border rounded-lg">
                <button
                  type="button"
                  onClick={() => toggleChapter(chapterIndex)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Badge variant="outline" className="text-xs">
                      Ch. {chapterIndex + 1}
                    </Badge>
                    {chapter.name}
                  </span>
                  {expandedChapters.has(chapterIndex) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {expandedChapters.has(chapterIndex) && (
                  <div className="px-3 pb-3 space-y-2">
                    {chapter.pages.map((page, pageIndex) => (
                      <div
                        key={pageIndex}
                        className="flex items-start gap-2 p-2 rounded-md bg-muted/50"
                      >
                        <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{page.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {page.content.substring(0, 150)}...
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {error && (
            <div className="w-full p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={onBack} disabled={isCreating}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={handleCreate} disabled={isCreating} className="flex-1">
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Book...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Create Book with {stats.totalPages} Pages
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
