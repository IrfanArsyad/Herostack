"use client";

import { TagInput } from "@/components/tag-input";

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface PageTagsProps {
  pageId: string;
  initialTags: Tag[];
}

export function PageTags({ pageId, initialTags }: PageTagsProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Tags:</span>
      <TagInput
        entityId={pageId}
        entityType="page"
        initialTags={initialTags}
      />
    </div>
  );
}
