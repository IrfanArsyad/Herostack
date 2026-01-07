"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Library, BookMarked, Eye, Pencil, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteShelf } from "@/lib/actions/shelves";

interface Shelf {
  id: string;
  name: string;
  slug: string;
  booksCount: number;
  team?: { name: string } | null;
}

interface ShelvesListProps {
  shelves: Shelf[];
}

export function ShelvesList({ shelves }: ShelvesListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (shelfId: string) => {
    setDeletingId(shelfId);
    await deleteShelf(shelfId);
    setDeletingId(null);
  };

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {shelves.map((shelf) => (
        <Card
          key={shelf.id}
          className="hover:bg-muted/50 transition-colors group"
        >
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded">
              <Library className="h-4 w-4 text-purple-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm truncate flex items-center gap-2">
                {shelf.name}
                {shelf.team && (
                  <Badge variant="outline" className="text-xs font-normal">
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
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                <Link href={`/shelves/${shelf.slug}`}>
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  View
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                <Link href={`/shelves/${shelf.slug}/edit`}>
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Shelf?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete &quot;{shelf.name}&quot; and all books within it.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(shelf.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={deletingId === shelf.id}
                    >
                      {deletingId === shelf.id ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
