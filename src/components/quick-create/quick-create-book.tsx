"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, BookMarked, Users } from "lucide-react";
import { createBook } from "@/lib/actions/books";

interface Shelf {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface QuickCreateBookProps {
  defaultShelfId?: string;
  defaultTeamId?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function QuickCreateBook({
  defaultShelfId,
  defaultTeamId,
  trigger,
  onSuccess,
}: QuickCreateBookProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedShelf, setSelectedShelf] = useState(defaultShelfId || "none");
  const [selectedTeam, setSelectedTeam] = useState(defaultTeamId || "personal");
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      Promise.all([
        fetch("/api/shelves").then((res) => res.json()),
        fetch("/api/my-teams").then((res) => res.json()),
      ])
        .then(([shelvesData, teamsData]) => {
          setShelves(shelvesData);
          setTeams(teamsData);
        })
        .catch(() => {});
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("description", description);
    formData.set("shelfId", selectedShelf === "none" ? "" : selectedShelf);
    if (selectedTeam !== "personal") {
      formData.set("teamId", selectedTeam);
    }

    const result = await createBook(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setOpen(false);
      setName("");
      setDescription("");
      setSelectedShelf(defaultShelfId || "none");
      setSelectedTeam(defaultTeamId || "personal");
      setShowAdvanced(false);
      onSuccess?.();
      router.refresh();
    }
  }

  if (!mounted) {
    return (
      trigger || (
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Book
        </Button>
      )
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Book
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-md">
              <BookMarked className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <DialogTitle>Create Book</DialogTitle>
              <DialogDescription>
                Enter a name to create a new book
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="book-name">Book Name</Label>
            <Input
              id="book-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Getting Started Guide"
              autoFocus
              required
            />
          </div>

          {teams.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Ownership
              </Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal (only me)</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedTeam === "personal"
                  ? "Only you can access this book"
                  : "All team members can access this book"}
              </p>
            </div>
          )}

          {!showAdvanced ? (
            <button
              type="button"
              onClick={() => setShowAdvanced(true)}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              + Add description & shelf
            </button>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="book-description">Description (optional)</Label>
                <Textarea
                  id="book-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this book"
                  rows={2}
                />
              </div>

              {shelves.length > 0 && (
                <div className="space-y-2">
                  <Label>Shelf (optional)</Label>
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
              )}
            </>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? "Creating..." : "Create Book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
