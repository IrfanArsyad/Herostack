"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createChapter } from "@/lib/actions/chapters";
import { ArrowLeft } from "lucide-react";

interface Book {
  id: string;
  name: string;
  slug: string;
}

export default function NewChapterPage() {
  const searchParams = useSearchParams();
  const defaultBookId = searchParams.get("book") || "";

  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState(defaultBookId);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchBooks() {
      const response = await fetch("/api/books");
      if (response.ok) {
        const data = await response.json();
        setBooks(data);
      }
    }
    fetchBooks();
  }, []);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    formData.set("bookId", selectedBook);
    const result = await createChapter(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  }

  const currentBook = books.find((b) => b.id === selectedBook);

  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Books", href: "/books" },
          ...(currentBook
            ? [{ label: currentBook.name, href: `/books/${currentBook.slug}` }]
            : []),
          { label: "New Chapter" },
        ]}
      />
      <div className="p-6 max-w-2xl mx-auto w-full">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={currentBook ? `/books/${currentBook.slug}` : "/books"}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create New Chapter</CardTitle>
            <CardDescription>
              Chapters help organize pages within a book.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="book">Book *</Label>
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
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter chapter name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe what this chapter covers"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading || !selectedBook}>
                  {isLoading ? "Creating..." : "Create Chapter"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link
                    href={currentBook ? `/books/${currentBook.slug}` : "/books"}
                  >
                    Cancel
                  </Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
