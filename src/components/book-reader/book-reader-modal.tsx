"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  X,
  ChevronLeft,
  ChevronRight,
  List,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Page {
  id: string;
  name: string;
  slug: string;
  html: string | null;
  chapterId: string | null;
}

interface Chapter {
  id: string;
  name: string;
  slug: string;
  pages: Page[];
}

interface BookData {
  id: string;
  name: string;
  description: string | null;
  chapters: Chapter[];
  directPages: Page[];
}

interface BookReaderModalProps {
  bookSlug: string;
  trigger: React.ReactNode;
}

export function BookReaderModal({ bookSlug, trigger }: BookReaderModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [book, setBook] = useState<BookData | null>(null);
  const [showToc, setShowToc] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !book) {
      fetchBook();
    }
  }, [open]);

  const fetchBook = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/books/${bookSlug}/read`);
      if (res.ok) {
        const data = await res.json();
        setBook(data);
        // Set first section as active
        if (data.chapters.length > 0 && data.chapters[0].pages.length > 0) {
          setActiveSection(data.chapters[0].pages[0].id);
        } else if (data.directPages.length > 0) {
          setActiveSection(data.directPages[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch book:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (pageId: string) => {
    const element = document.getElementById(`page-${pageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(pageId);
    }
  };

  const handleScroll = () => {
    if (!contentRef.current || !book) return;

    const allPages = [
      ...book.directPages,
      ...book.chapters.flatMap((c) => c.pages),
    ];

    for (const page of allPages) {
      const element = document.getElementById(`page-${page.id}`);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.top >= 0 && rect.top < 200) {
          setActiveSection(page.id);
          break;
        }
      }
    }
  };

  const allPages = book
    ? [...book.directPages, ...book.chapters.flatMap((c) => c.pages)]
    : [];

  const currentIndex = allPages.findIndex((p) => p.id === activeSection);
  const prevPage = currentIndex > 0 ? allPages[currentIndex - 1] : null;
  const nextPage =
    currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <DialogContent className="!max-w-[98vw] !w-[98vw] !h-[95vh] p-0 gap-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b shrink-0 pr-14">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <DialogTitle className="text-lg">
                {book?.name || "Loading..."}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowToc(!showToc)}
              >
                <List className="h-4 w-4 mr-1" />
                {showToc ? "Hide" : "Show"} TOC
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Table of Contents Sidebar */}
          {showToc && book && (
            <div className="w-64 border-r shrink-0 overflow-hidden flex flex-col">
              <div className="px-3 py-2 border-b bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground">
                  Table of Contents
                </span>
              </div>
              <div className="flex-1 overflow-auto">
                <div className="p-2 space-y-1">
                  {/* Direct pages */}
                  {book.directPages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => scrollToSection(page.id)}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-muted transition-colors truncate",
                        activeSection === page.id &&
                          "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      {page.name}
                    </button>
                  ))}

                  {/* Chapters with pages */}
                  {book.chapters.map((chapter) => (
                    <div key={chapter.id} className="space-y-1">
                      <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {chapter.name}
                      </div>
                      {chapter.pages.map((page) => (
                        <button
                          key={page.id}
                          onClick={() => scrollToSection(page.id)}
                          className={cn(
                            "w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-muted transition-colors truncate pl-5",
                            activeSection === page.id &&
                              "bg-primary/10 text-primary font-medium"
                          )}
                        >
                          {page.name}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : book ? (
              <div
                className="flex-1 overflow-auto"
                onScroll={handleScroll}
                ref={contentRef}
              >
                <div className="max-w-3xl mx-auto p-6 space-y-12">
                  {/* Book intro */}
                  {book.description && (
                    <div className="text-center pb-8 border-b">
                      <h1 className="text-3xl font-bold mb-4">{book.name}</h1>
                      <p className="text-muted-foreground">{book.description}</p>
                    </div>
                  )}

                  {/* Direct pages */}
                  {book.directPages.map((page) => (
                    <div key={page.id} id={`page-${page.id}`} className="scroll-mt-6">
                      <h2 className="text-2xl font-bold mb-4">{page.name}</h2>
                      {page.html ? (
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: page.html }}
                        />
                      ) : (
                        <p className="text-muted-foreground italic">
                          No content
                        </p>
                      )}
                      <Separator className="mt-8" />
                    </div>
                  ))}

                  {/* Chapters */}
                  {book.chapters.map((chapter) => (
                    <div key={chapter.id} className="space-y-8">
                      <div className="text-center py-4 bg-muted/30 rounded-lg">
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">
                          Chapter
                        </span>
                        <h2 className="text-xl font-bold">{chapter.name}</h2>
                      </div>

                      {chapter.pages.map((page) => (
                        <div
                          key={page.id}
                          id={`page-${page.id}`}
                          className="scroll-mt-6"
                        >
                          <h3 className="text-xl font-semibold mb-4">
                            {page.name}
                          </h3>
                          {page.html ? (
                            <div
                              className="prose prose-sm dark:prose-invert max-w-none"
                              dangerouslySetInnerHTML={{ __html: page.html }}
                            />
                          ) : (
                            <p className="text-muted-foreground italic">
                              No content
                            </p>
                          )}
                          <Separator className="mt-8" />
                        </div>
                      ))}
                    </div>
                  ))}

                  {/* End of book */}
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">End of book</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">Failed to load book</p>
              </div>
            )}

            {/* Navigation footer */}
            {book && allPages.length > 1 && (
              <div className="border-t px-4 py-2 flex items-center justify-between bg-muted/30">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!prevPage}
                  onClick={() => prevPage && scrollToSection(prevPage.id)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {prevPage?.name || "Previous"}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {currentIndex + 1} / {allPages.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!nextPage}
                  onClick={() => nextPage && scrollToSection(nextPage.id)}
                >
                  {nextPage?.name || "Next"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
