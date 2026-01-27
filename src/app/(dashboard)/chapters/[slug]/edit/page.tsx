"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateChapter } from "@/lib/actions/chapters";
import { ArrowLeft } from "lucide-react";

interface EditChapterPageProps {
  params: Promise<{ slug: string }>;
}

interface Chapter {
  id: string;
  name: string;
  description: string | null;
  book: {
    name: string;
    slug: string;
  };
}

export default function EditChapterPage({ params }: EditChapterPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/chapters/${slug}`);

      if (res.ok) {
        const data = await res.json();
        setChapter(data);
      }
    }
    fetchData();
  }, [slug]);

  async function handleSubmit(formData: FormData) {
    if (!chapter) return;
    setIsLoading(true);
    setError(null);

    const result = await updateChapter(chapter.id, formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push(`/chapters/${slug}`);
    }
  }

  if (!chapter) {
    return (
      <>
        <Header breadcrumbs={[{ label: "Loading..." }]} />
        <div className="p-6">Loading...</div>
      </>
    );
  }

  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Books", href: "/books" },
          { label: chapter.book.name, href: `/books/${chapter.book.slug}` },
          { label: chapter.name, href: `/chapters/${slug}` },
          { label: "Edit" },
        ]}
      />
      <div className="p-6 max-w-2xl mx-auto w-full">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/chapters/${slug}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Chapter
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Edit Chapter</CardTitle>
            <CardDescription>Update the chapter details below.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Chapter Title *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={chapter.name}
                  placeholder="Enter chapter title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={chapter.description ?? ""}
                  placeholder="Describe what this chapter is about"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={`/chapters/${slug}`}>Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
