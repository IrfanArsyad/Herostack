"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookMarked, Eye, Pencil, Search, X, BookOpen, Share2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BookReaderModal } from "@/components/book-reader/book-reader-modal";
import { toast } from "sonner";

interface Book {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shelf: { name: string } | null;
  team?: { name: string } | null;
}

interface BooksListProps {
  books: Book[];
}

export function BooksList({ books }: BooksListProps) {
  const [search, setSearch] = useState("");

  const filteredBooks = useMemo(() => {
    if (!search.trim()) return books;

    const query = search.toLowerCase();
    return books.filter(
      (book) =>
        book.name.toLowerCase().includes(query) ||
        book.shelf?.name.toLowerCase().includes(query) ||
        book.description?.toLowerCase().includes(query)
    );
  }, [books, search]);

  const handleShare = async (book: Book) => {
    const url = `${window.location.origin}/books/${book.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search books..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results count */}
      {search && (
        <p className="text-sm text-muted-foreground">
          Found {filteredBooks.length} {filteredBooks.length === 1 ? "book" : "books"}
          {filteredBooks.length !== books.length && ` of ${books.length}`}
        </p>
      )}

      {/* Books list */}
      {filteredBooks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <BookMarked className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              {search ? "No books match your search" : "No books yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {filteredBooks.map((book) => (
            <Card key={book.id} className="hover:bg-muted/50 transition-colors group relative">
              {/* Share button - top right corner */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleShare(book)}
                title="Copy link"
              >
                <Share2 className="h-3.5 w-3.5" />
              </Button>

              <CardContent className="py-3 px-4 flex items-center gap-3 pr-12">
                <div className="p-2 bg-blue-500/10 rounded">
                  <BookMarked className="h-4 w-4 text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate flex items-center gap-2">
                    {book.name}
                    {book.team && (
                      <Badge variant="outline" className="text-xs font-normal shrink-0">
                        <Users className="h-3 w-3 mr-1" />
                        {book.team.name}
                      </Badge>
                    )}
                  </div>
                  {book.shelf && (
                    <div className="text-xs text-muted-foreground truncate">
                      {book.shelf.name}
                    </div>
                  )}
                  {book.description && !book.shelf && (
                    <div className="text-xs text-muted-foreground truncate">
                      {book.description}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <BookReaderModal
                    bookSlug={book.slug}
                    trigger={
                      <Button variant="ghost" size="sm" className="h-7 px-2">
                        <BookOpen className="h-3.5 w-3.5 mr-1" />
                        Read
                      </Button>
                    }
                  />
                  <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                    <Link href={`/books/${book.slug}`}>
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                    <Link href={`/books/${book.slug}/edit`}>
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
