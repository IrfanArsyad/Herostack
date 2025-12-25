"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { createPage } from "@/lib/actions/pages";
import { ArrowLeft } from "lucide-react";

interface Book {
  id: string;
  name: string;
  slug: string;
}

interface Chapter {
  id: string;
  name: string;
  bookId: string;
}

export default function NewPagePage() {
  const searchParams = useSearchParams();
  const defaultBookId = searchParams.get("book") || "";
  const defaultChapterId = searchParams.get("chapter") || "";

  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedBook, setSelectedBook] = useState(defaultBookId);
  const [selectedChapter, setSelectedChapter] = useState(defaultChapterId);
  const [content, setContent] = useState("");
  const [html, setHtml] = useState("");
  const [isDraft, setIsDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [booksRes, chaptersRes] = await Promise.all([
        fetch("/api/books"),
        fetch("/api/chapters"),
      ]);

      if (booksRes.ok) {
        const data = await booksRes.json();
        setBooks(data);
      }

      if (chaptersRes.ok) {
        const data = await chaptersRes.json();
        setChapters(data);

        // If chapter is pre-selected, set the book too
        if (defaultChapterId) {
          const chapter = data.find(
            (c: Chapter) => c.id === defaultChapterId
          );
          if (chapter) {
            setSelectedBook(chapter.bookId);
          }
        }
      }
    }
    fetchData();
  }, [defaultChapterId]);

  const filteredChapters = chapters.filter((c) => c.bookId === selectedBook);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    formData.set("content", content);
    formData.set("html", html);
    formData.set("bookId", selectedBook === "none" ? "" : selectedBook);
    formData.set("chapterId", selectedChapter === "none" ? "" : selectedChapter);
    formData.set("draft", isDraft.toString());

    const result = await createPage(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  }

  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Pages", href: "/pages" },
          { label: "New Page" },
        ]}
      />
      <div className="p-6 max-w-5xl mx-auto w-full">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/pages">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pages
          </Link>
        </Button>

        <form action={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Page Details</CardTitle>
              <CardDescription>
                Set the page name and location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Page Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter page name"
                  required
                  className="max-w-md"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
                <div className="space-y-2">
                  <Label>Book (Optional)</Label>
                  <Select value={selectedBook} onValueChange={setSelectedBook}>
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

                <div className="space-y-2">
                  <Label>Chapter (Optional)</Label>
                  <Select
                    value={selectedChapter}
                    onValueChange={setSelectedChapter}
                    disabled={!selectedBook}
                  >
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
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="draft"
                  checked={isDraft}
                  onCheckedChange={setIsDraft}
                />
                <Label htmlFor="draft">Save as draft</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>
                Write your page content using the rich text editor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TiptapEditor
                onChange={(jsonContent, htmlContent) => {
                  setContent(jsonContent);
                  setHtml(htmlContent);
                }}
                placeholder="Start writing your page content..."
              />
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Page"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/pages">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
