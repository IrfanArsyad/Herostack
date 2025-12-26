"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Eye, Pencil, Search, X, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Page {
  id: string;
  name: string;
  slug: string;
  draft: boolean;
  updatedAt: Date;
  book: { name: string } | null;
  team?: { name: string } | null;
}

interface PagesListProps {
  pages: Page[];
}

export function PagesList({ pages }: PagesListProps) {
  const [search, setSearch] = useState("");

  const filteredPages = useMemo(() => {
    if (!search.trim()) return pages;

    const query = search.toLowerCase();
    return pages.filter(
      (page) =>
        page.name.toLowerCase().includes(query) ||
        page.book?.name.toLowerCase().includes(query)
    );
  }, [pages, search]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search pages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results count */}
      {search && (
        <p className="text-sm text-muted-foreground">
          Found {filteredPages.length} {filteredPages.length === 1 ? "page" : "pages"}
          {filteredPages.length !== pages.length && ` of ${pages.length}`}
        </p>
      )}

      {/* Pages list */}
      {filteredPages.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              {search ? "No pages match your search" : "No pages yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {filteredPages.map((page) => (
            <Card
              key={page.id}
              className="hover:bg-muted/50 transition-colors group"
            >
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {page.name}
                      </span>
                      {page.draft && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          Draft
                        </Badge>
                      )}
                      {page.team && (
                        <Badge variant="outline" className="text-xs font-normal shrink-0">
                          <Users className="h-3 w-3 mr-1" />
                          {page.team.name}
                        </Badge>
                      )}
                    </div>
                    {page.book && (
                      <div className="text-xs text-muted-foreground truncate">
                        {page.book.name}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(page.updatedAt), {
                      addSuffix: true,
                    })}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      asChild
                    >
                      <Link href={`/pages/${page.slug}`}>
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Read
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      asChild
                    >
                      <Link href={`/pages/${page.slug}/edit`}>
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
