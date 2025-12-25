"use client";

import { useState, useEffect, use } from "react";
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
import { updateBook } from "@/lib/actions/books";
import { ArrowLeft } from "lucide-react";

interface EditBookPageProps {
  params: Promise<{ slug: string }>;
}

interface Book {
  id: string;
  name: string;
  description: string | null;
  shelfId: string | null;
}

interface Shelf {
  id: string;
  name: string;
}

export default function EditBookPage({ params }: EditBookPageProps) {
  const { slug } = use(params);
  const [book, setBook] = useState<Book | null>(null);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [selectedShelf, setSelectedShelf] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [bookRes, shelvesRes] = await Promise.all([
        fetch(`/api/books/${slug}`),
        fetch("/api/shelves"),
      ]);

      if (bookRes.ok) {
        const bookData = await bookRes.json();
        setBook(bookData);
        setSelectedShelf(bookData.shelfId || "none");
      }

      if (shelvesRes.ok) {
        const shelvesData = await shelvesRes.json();
        setShelves(shelvesData);
      }
    }
    fetchData();
  }, [slug]);

  async function handleSubmit(formData: FormData) {
    if (!book) return;
    setIsLoading(true);
    setError(null);

    formData.set("shelfId", selectedShelf === "none" ? "" : selectedShelf);
    const result = await updateBook(book.id, formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  }

  if (!book) {
    return (
      <>
        <Header breadcrumbs={[{ label: "Loading..." }]} />
        <div className="p-6">Loading...</div>
      </>
    );
  }

  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Books", href: "/books" },
          { label: book.name, href: `/books/${slug}` },
          { label: "Edit" },
        ]}
      />
      <div className="p-6 max-w-2xl mx-auto w-full">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/books/${slug}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Book
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Edit Book</CardTitle>
            <CardDescription>Update the book details below.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={book.name}
                  placeholder="Enter book name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={book.description ?? ""}
                  placeholder="Describe what this book is about"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shelf">Shelf</Label>
                <Select value={selectedShelf} onValueChange={setSelectedShelf}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a shelf" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No shelf</SelectItem>
                    {shelves.map((shelf) => (
                      <SelectItem key={shelf.id} value={shelf.id}>
                        {shelf.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={`/books/${slug}`}>Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
