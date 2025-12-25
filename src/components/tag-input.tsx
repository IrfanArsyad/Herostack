"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  addTagToEntity,
  removeTagFromEntity,
  createTag,
} from "@/lib/actions/tags";

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface TagInputProps {
  entityId: string;
  entityType: "shelf" | "book" | "chapter" | "page";
  initialTags?: Tag[];
}

export function TagInput({ entityId, entityType, initialTags = [] }: TagInputProps) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchTags() {
      const response = await fetch("/api/tags");
      if (response.ok) {
        const data = await response.json();
        setAllTags(data);
      }
    }
    fetchTags();
  }, []);

  const availableTags = allTags.filter(
    (t) => !tags.some((et) => et.id === t.id)
  );

  async function handleAddTag(tag: Tag) {
    setIsLoading(true);
    const result = await addTagToEntity(tag.id, entityId, entityType);
    if (result.success) {
      setTags([...tags, tag]);
      toast.success(`Tag "${tag.name}" added`);
    } else {
      toast.error(result.error);
    }
    setIsLoading(false);
  }

  async function handleRemoveTag(tag: Tag) {
    setIsLoading(true);
    const result = await removeTagFromEntity(tag.id, entityId, entityType);
    if (result.success) {
      setTags(tags.filter((t) => t.id !== tag.id));
      toast.success(`Tag "${tag.name}" removed`);
    } else {
      toast.error(result.error);
    }
    setIsLoading(false);
  }

  async function handleCreateTag() {
    if (!newTagName.trim()) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.set("name", newTagName.trim());

    const result = await createTag(formData);
    if (result.success && result.tag) {
      setAllTags([...allTags, result.tag]);
      await handleAddTag(result.tag);
      setNewTagName("");
    } else {
      toast.error(result.error);
    }
    setIsLoading(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <Badge key={tag.id} variant="secondary" className="gap-1">
          {tag.name}
          <button
            type="button"
            onClick={() => handleRemoveTag(tag)}
            className="ml-1 hover:text-destructive"
            disabled={isLoading}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-6 gap-1">
            <Plus className="h-3 w-3" />
            Add Tag
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Tags</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Create new tag..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateTag();
                  }
                }}
              />
              <Button
                onClick={handleCreateTag}
                disabled={isLoading || !newTagName.trim()}
              >
                Create
              </Button>
            </div>

            {availableTags.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Click to add existing tags:
                </p>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => handleAddTag(tag)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {availableTags.length === 0 && allTags.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tags yet. Create your first tag above.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
