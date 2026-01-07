"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Library, BookMarked, Eye, Pencil, Users, Trash2, MoreHorizontal, Globe, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { deleteShelf } from "@/lib/actions/shelves";
import { format } from "date-fns";

interface Shelf {
  id: string;
  name: string;
  slug: string;
  booksCount: number;
  isPublic?: boolean;
  team?: { name: string } | null;
  createdBy?: { name: string | null; image: string | null } | null;
  createdAt?: Date;
}

interface ShelvesListProps {
  shelves: Shelf[];
  isSuperAdmin?: boolean;
}

export function ShelvesList({ shelves, isSuperAdmin }: ShelvesListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shelfToDelete, setShelfToDelete] = useState<Shelf | null>(null);

  const handleDelete = async () => {
    if (!shelfToDelete) return;
    setDeletingId(shelfToDelete.id);
    await deleteShelf(shelfToDelete.id);
    setDeletingId(null);
    setDeleteDialogOpen(false);
    setShelfToDelete(null);
  };

  const openDeleteDialog = (shelf: Shelf) => {
    setShelfToDelete(shelf);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        {shelves.map((shelf) => (
          <Card key={shelf.id} className="hover:bg-muted/50 transition-colors group">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded shrink-0">
                  <Library className="h-4 w-4 text-purple-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate flex items-center gap-2">
                    {shelf.name}
                    {shelf.isPublic && (
                      <Badge variant="secondary" className="text-xs font-normal shrink-0 hidden sm:inline-flex bg-green-500/10 text-green-600 border-green-500/20">
                        <Globe className="h-3 w-3" />
                        Public
                      </Badge>
                    )}
                    {shelf.team && (
                      <Badge variant="outline" className="text-xs font-normal shrink-0 hidden sm:inline-flex">
                        <Users className="h-3 w-3 mr-1" />
                        {shelf.team.name}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <BookMarked className="h-3 w-3" />
                    {shelf.booksCount} book{shelf.booksCount !== 1 ? "s" : ""}
                  </div>
                </div>
                {isSuperAdmin && shelf.createdBy && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-1.5 rounded-full bg-muted hover:bg-muted/80 cursor-help shrink-0">
                        <UserCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="text-xs">
                      <div className="font-medium">{shelf.createdBy.name || "Unknown"}</div>
                      {shelf.createdAt && (
                        <div className="text-muted-foreground">
                          {format(new Date(shelf.createdAt), "MMM d, yyyy")}
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
                    <DropdownMenuItem asChild>
                      <Link href={`/shelves/${shelf.slug}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/shelves/${shelf.slug}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => openDeleteDialog(shelf)}
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
            <AlertDialogTitle>Delete Shelf?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{shelfToDelete?.name}&quot; and all books within it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingId === shelfToDelete?.id}
            >
              {deletingId === shelfToDelete?.id ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
