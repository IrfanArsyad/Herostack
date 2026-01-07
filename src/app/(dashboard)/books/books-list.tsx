"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookMarked, Eye, Pencil, Search, X, BookOpen, Share2, Users, Trash2, MoreHorizontal, Globe, UserCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BookReaderModal } from "@/components/book-reader/book-reader-modal";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteBook } from "@/lib/actions/books";
import { format } from "date-fns";

interface Book {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isPublic?: boolean;
  shelf: { name: string } | null;
  team?: { name: string } | null;
  createdBy?: { name: string | null; image: string | null } | null;
  createdAt?: Date;
}

interface BooksListProps {
  books: Book[];
  isSuperAdmin?: boolean;
}

export function BooksList({ books, isSuperAdmin }: BooksListProps) {
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  const handleDelete = async () => {
    if (!bookToDelete) return;
    setDeletingId(bookToDelete.id);
    await deleteBook(bookToDelete.id);
    setDeletingId(null);
    setDeleteDialogOpen(false);
    setBookToDelete(null);
  };

  const openDeleteDialog = (book: Book) => {
    setBookToDelete(book);
    setDeleteDialogOpen(true);
  };

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
            <Card key={book.id} className="hover:bg-muted/50 transition-colors group">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded shrink-0">
                    <BookMarked className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate flex items-center gap-2">
                      {book.name}
                      {book.isPublic && (
                        <Badge variant="secondary" className="text-xs font-normal shrink-0 hidden sm:inline-flex bg-green-500/10 text-green-600 border-green-500/20">
                          <Globe className="h-3 w-3" />
                          Public
                        </Badge>
                      )}
                      {book.team && (
                        <Badge variant="outline" className="text-xs font-normal shrink-0 hidden sm:inline-flex">
                          <Users className="h-3 w-3 mr-1" />
                          {book.team.name}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {book.shelf?.name || book.description || "No description"}
                    </div>
                  </div>
                  {isSuperAdmin && book.createdBy && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-1.5 rounded-full bg-muted hover:bg-muted/80 cursor-help shrink-0">
                          <UserCircle className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="text-xs">
                        <div className="font-medium">{book.createdBy.name || "Unknown"}</div>
                        {book.createdAt && (
                          <div className="text-muted-foreground">
                            {format(new Date(book.createdAt), "MMM d, yyyy")}
                          </div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <BookReaderModal
                        bookSlug={book.slug}
                        trigger={
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Read
                          </DropdownMenuItem>
                        }
                      />
                      <DropdownMenuItem asChild>
                        <Link href={`/books/${book.slug}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/books/${book.slug}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare(book)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(book)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Book?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{bookToDelete?.name}&quot; and all chapters and pages within it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingId === bookToDelete?.id}
            >
              {deletingId === bookToDelete?.id ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
