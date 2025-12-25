"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, BookMarked, Library, FolderOpen } from "lucide-react";

interface SearchResult {
  id: string;
  type: "shelf" | "book" | "chapter" | "page";
  name: string;
  slug: string;
  snippet?: string | null;
  rank?: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "shelf":
        return <Library className="h-4 w-4" />;
      case "book":
        return <BookMarked className="h-4 w-4" />;
      case "chapter":
        return <FolderOpen className="h-4 w-4" />;
      case "page":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getHref = (result: SearchResult) => {
    switch (result.type) {
      case "shelf":
        return `/shelves/${result.slug}`;
      case "book":
        return `/books/${result.slug}`;
      case "chapter":
        return `/chapters/${result.slug}`;
      case "page":
        return `/pages/${result.slug}`;
      default:
        return "#";
    }
  };

  return (
    <>
      <Header breadcrumbs={[{ label: "Search" }]} />
      <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
        <div>
          <h1 className="text-3xl font-bold">Search</h1>
          <p className="text-muted-foreground mt-1">
            Search across all your documentation
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search shelves, books, chapters, pages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={isSearching}>
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </form>

        {hasSearched && (
          <div className="space-y-2">
            {results.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No results found for &quot;{query}&quot;
                </CardContent>
              </Card>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Found {results.length} result{results.length !== 1 ? "s" : ""}
                </p>
                {results.map((result) => (
                  <Link key={`${result.type}-${result.id}`} href={getHref(result)}>
                    <Card className="hover:border-primary transition-colors cursor-pointer">
                      <CardHeader className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="text-muted-foreground">
                            {getIcon(result.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base">
                                {result.name}
                              </CardTitle>
                              <Badge variant="secondary" className="text-xs">
                                {result.type}
                              </Badge>
                            </div>
                            {result.snippet && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {result.snippet}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
