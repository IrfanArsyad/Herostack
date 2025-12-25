"use client";

import { TagInput } from "@/components/tag-input";

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface ChapterTagsProps {
  chapterId: string;
  initialTags: Tag[];
}

export function ChapterTags({ chapterId, initialTags }: ChapterTagsProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Tags:</span>
      <TagInput
        entityId={chapterId}
        entityType="chapter"
        initialTags={initialTags}
      />
    </div>
  );
}
