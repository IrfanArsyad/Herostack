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
import { Plus, Library } from "lucide-react";
import { createShelf } from "@/lib/actions/shelves";

interface QuickCreateShelfProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function QuickCreateShelf({ trigger, onSuccess }: QuickCreateShelfProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("description", description);

    const result = await createShelf(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setOpen(false);
      setName("");
      setDescription("");
      setShowAdvanced(false);
      onSuccess?.();
      router.refresh();
    }
  }

  if (!mounted) {
    return trigger || (
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        New Shelf
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Shelf
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-md">
              <Library className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <DialogTitle>Create Shelf</DialogTitle>
              <DialogDescription>
                Enter a name to create a new shelf
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
            <Label htmlFor="shelf-name">Shelf Name</Label>
            <Input
              id="shelf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Development Documentation"
              autoFocus
              required
            />
          </div>

          {!showAdvanced ? (
            <button
              type="button"
              onClick={() => setShowAdvanced(true)}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              + Add description
            </button>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="shelf-description">Description (optional)</Label>
              <Textarea
                id="shelf-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this shelf"
                rows={2}
              />
            </div>
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
              {isLoading ? "Creating..." : "Create Shelf"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
