"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Eye, Pencil, Search, X, Users, Trash2, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
import { deletePage } from "@/lib/actions/pages";

interface Page {
  id: string;
  name: string;
  slug: string;
  draft: boolean;
  updatedAt: Date;
  book: { name: string } | null;
  team?: { name: string } | null;
}

interface PagesListProps {
  pages: Page[];
}

export function PagesList({ pages }: PagesListProps) {
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null);

  const handleDelete = async () => {
    if (!pageToDelete) return;
    setDeletingId(pageToDelete.id);
    await deletePage(pageToDelete.id);
    setDeletingId(null);
    setDeleteDialogOpen(false);
    setPageToDelete(null);
  };

  const openDeleteDialog = (page: Page) => {
    setPageToDelete(page);
    setDeleteDialogOpen(true);
  };

  const filteredPages = useMemo(() => {
    if (!search.trim()) return pages;

    const query = search.toLowerCase();
    return pages.filter(
      (page) =>
        page.name.toLowerCase().includes(query) ||
        page.book?.name.toLowerCase().includes(query)
    );
  }, [pages, search]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search pages..."
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
          Found {filteredPages.length} {filteredPages.length === 1 ? "page" : "pages"}
          {filteredPages.length !== pages.length && ` of ${pages.length}`}
        </p>
      )}

      {/* Pages list */}
      {filteredPages.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              {search ? "No pages match your search" : "No pages yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {filteredPages.map((page) => (
            <Card key={page.id} className="hover:bg-muted/50 transition-colors group">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {page.name}
                      </span>
                      {page.draft && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Draft
                        </Badge>
                      )}
                      {page.team && (
                        <Badge variant="outline" className="text-xs font-normal shrink-0 hidden sm:inline-flex">
                          <Users className="h-3 w-3 mr-1" />
                          {page.team.name}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
                      {page.book?.name && <span>{page.book.name}</span>}
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline">
                        {formatDistanceToNow(new Date(page.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/pages/${page.slug}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Read
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/pages/${page.slug}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(page)}
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
            <AlertDialogTitle>Delete Page?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{pageToDelete?.name}&quot; and all its revisions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingId === pageToDelete?.id}
            >
              {deletingId === pageToDelete?.id ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
