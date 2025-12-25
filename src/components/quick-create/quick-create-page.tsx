"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, FileText } from "lucide-react";
import { createPage } from "@/lib/actions/pages";

interface Book {
  id: string;
  name: string;
}

interface Chapter {
  id: string;
  name: string;
  bookId: string;
}

interface QuickCreatePageProps {
  defaultBookId?: string;
  defaultChapterId?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function QuickCreatePage({
  defaultBookId,
  defaultChapterId,
  trigger,
  onSuccess
}: QuickCreatePageProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedBook, setSelectedBook] = useState(defaultBookId || "none");
  const [selectedChapter, setSelectedChapter] = useState(defaultChapterId || "none");
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      fetch("/api/books")
        .then((res) => res.json())
        .then((data) => setBooks(data))
        .catch(() => {});

      fetch("/api/chapters")
        .then((res) => res.json())
        .then((data) => setChapters(data))
        .catch(() => {});
    }
  }, [open]);

  const filteredChapters = selectedBook && selectedBook !== "none"
    ? chapters.filter((c) => c.bookId === selectedBook)
    : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("bookId", selectedBook === "none" ? "" : selectedBook);
    formData.set("chapterId", selectedChapter === "none" ? "" : selectedChapter);
    formData.set("content", "");
    formData.set("html", "");
    formData.set("draft", "false");

    const result = await createPage(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setOpen(false);
      setName("");
      setSelectedBook(defaultBookId || "none");
      setSelectedChapter(defaultChapterId || "none");
      onSuccess?.();
      router.refresh();
    }
  }

  if (!mounted) {
    return trigger || (
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        New Page
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Page
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-md">
              <FileText className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <DialogTitle>Create Page</DialogTitle>
              <DialogDescription>
                Enter a name to create a new page
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="page-name">Page Name</Label>
            <Input
              id="page-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Introduction"
              autoFocus
              required
            />
          </div>

          {books.length > 0 && !defaultBookId && (
            <div className="space-y-2">
              <Label>Book (optional)</Label>
              <Select
                value={selectedBook}
                onValueChange={(value) => {
                  setSelectedBook(value);
                  setSelectedChapter("none");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a book" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No book</SelectItem>
                  {books.map((book) => (
                    <SelectItem key={book.id} value={book.id}>
                      {book.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {filteredChapters.length > 0 && !defaultChapterId && (
            <div className="space-y-2">
              <Label>Chapter (optional)</Label>
              <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a chapter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No chapter</SelectItem>
                  {filteredChapters.map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.id}>
                      {chapter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? "Creating..." : "Create Page"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
