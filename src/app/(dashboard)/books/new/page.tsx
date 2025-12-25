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
import { createBook } from "@/lib/actions/books";
import { ArrowLeft } from "lucide-react";

interface Shelf {
  id: string;
  name: string;
}

export default function NewBookPage() {
  const searchParams = useSearchParams();
  const defaultShelfId = searchParams.get("shelf") || "";

  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [selectedShelf, setSelectedShelf] = useState(defaultShelfId);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchShelves() {
      const response = await fetch("/api/shelves");
      if (response.ok) {
        const data = await response.json();
        setShelves(data);
      }
    }
    fetchShelves();
  }, []);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    formData.set("shelfId", selectedShelf === "none" ? "" : selectedShelf);
    const result = await createBook(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  }

  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Books", href: "/books" },
          { label: "New Book" },
        ]}
      />
      <div className="p-6 max-w-2xl mx-auto w-full">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/books">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Books
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create New Book</CardTitle>
            <CardDescription>
              Books contain chapters and pages of documentation.
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
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter book name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe what this book is about"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shelf">Shelf (Optional)</Label>
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
                  {isLoading ? "Creating..." : "Create Book"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/books">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
