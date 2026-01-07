"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Hash, Library, BookMarked, FileText, Layers, Eye, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { deleteTag } from "@/lib/actions/tags";

interface Tag {
  id: string;
  name: string;
  slug: string;
  total: number;
  counts: Record<string, number>;
}

interface TagsListProps {
  tags: Tag[];
}

export function TagsList({ tags }: TagsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

  const handleDelete = async () => {
    if (!tagToDelete) return;
    setDeletingId(tagToDelete.id);
    await deleteTag(tagToDelete.id);
    setDeletingId(null);
    setDeleteDialogOpen(false);
    setTagToDelete(null);
  };

  const openDeleteDialog = (tag: Tag) => {
    setTagToDelete(tag);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tags.map((tag) => (
          <Card key={tag.id} className="hover:bg-muted/50 transition-colors h-full">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-primary/10 shrink-0">
                  <Hash className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{tag.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tag.total} {tag.total === 1 ? "item" : "items"}
                  </p>
                  {tag.total > 0 && (
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {tag.counts.shelf && (
                        <span className="flex items-center gap-1">
                          <Library className="h-3 w-3" />
                          {tag.counts.shelf}
                        </span>
                      )}
                      {tag.counts.book && (
                        <span className="flex items-center gap-1">
                          <BookMarked className="h-3 w-3" />
                          {tag.counts.book}
                        </span>
                      )}
                      {tag.counts.chapter && (
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          {tag.counts.chapter}
                        </span>
                      )}
                      {tag.counts.page && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {tag.counts.page}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/tags/${tag.slug}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => openDeleteDialog(tag)}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the tag &quot;{tagToDelete?.name}&quot;. Items tagged with this tag will no longer have it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingId === tagToDelete?.id}
            >
              {deletingId === tagToDelete?.id ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
