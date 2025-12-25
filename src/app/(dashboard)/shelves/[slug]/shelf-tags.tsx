"use client";

import { TagInput } from "@/components/tag-input";

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface ShelfTagsProps {
  shelfId: string;
  initialTags: Tag[];
}

export function ShelfTags({ shelfId, initialTags }: ShelfTagsProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Tags:</span>
      <TagInput
        entityId={shelfId}
        entityType="shelf"
        initialTags={initialTags}
      />
    </div>
  );
}
