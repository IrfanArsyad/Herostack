"use client";

import { TagInput } from "@/components/tag-input";

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface BookTagsProps {
  bookId: string;
  initialTags: Tag[];
}

export function BookTags({ bookId, initialTags }: BookTagsProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Tags:</span>
      <TagInput
        entityId={bookId}
        entityType="book"
        initialTags={initialTags}
      />
    </div>
  );
}
