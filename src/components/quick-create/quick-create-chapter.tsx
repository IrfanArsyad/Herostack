"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, FolderOpen } from "lucide-react";
import { createChapter } from "@/lib/actions/chapters";

interface Book {
  id: string;
  name: string;
}

interface QuickCreateChapterProps {
  defaultBookId?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function QuickCreateChapter({
  defaultBookId,
  trigger,
  onSuccess
}: QuickCreateChapterProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedBook, setSelectedBook] = useState(defaultBookId || "");
  const [books, setBooks] = useState<Book[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open && !defaultBookId) {
      fetch("/api/books")
        .then((res) => res.json())
        .then((data) => setBooks(data))
        .catch(() => {});
    }
  }, [open, defaultBookId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !selectedBook) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("description", description);
    formData.set("bookId", selectedBook);

    const result = await createChapter(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setOpen(false);
      setName("");
      setDescription("");
      setSelectedBook(defaultBookId || "");
      setShowAdvanced(false);
      onSuccess?.();
      router.refresh();
    }
  }

  if (!mounted) {
    return trigger || (
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        New Chapter
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Chapter
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-md">
              <FolderOpen className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <DialogTitle>Create Chapter</DialogTitle>
              <DialogDescription>
                Enter a name to create a new chapter
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
            <Label htmlFor="chapter-name">Chapter Name</Label>
            <Input
              id="chapter-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Getting Started"
              autoFocus
              required
            />
          </div>

          {!defaultBookId && books.length > 0 && (
            <div className="space-y-2">
              <Label>Book *</Label>
              <Select value={selectedBook} onValueChange={setSelectedBook}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a book" />
                </SelectTrigger>
                <SelectContent>
                  {books.map((book) => (
                    <SelectItem key={book.id} value={book.id}>
                      {book.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!showAdvanced ? (
            <button
              type="button"
              onClick={() => setShowAdvanced(true)}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              + Add description
            </button>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="chapter-description">Description (optional)</Label>
              <Textarea
                id="chapter-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this chapter"
                rows={2}
              />
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
            <Button
              type="submit"
              disabled={isLoading || !name.trim() || !selectedBook}
            >
              {isLoading ? "Creating..." : "Create Chapter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
