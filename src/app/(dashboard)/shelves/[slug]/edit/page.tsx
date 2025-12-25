"use client";

import { useState, useEffect } from "react";
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
import { updateShelf } from "@/lib/actions/shelves";
import { ArrowLeft } from "lucide-react";
import { use } from "react";

interface EditShelfPageProps {
  params: Promise<{ slug: string }>;
}

export default function EditShelfPage({ params }: EditShelfPageProps) {
  const { slug } = use(params);
  const [shelf, setShelf] = useState<{
    id: string;
    name: string;
    description: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchShelf() {
      const response = await fetch(`/api/shelves/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setShelf(data);
      }
    }
    fetchShelf();
  }, [slug]);

  async function handleSubmit(formData: FormData) {
    if (!shelf) return;
    setIsLoading(true);
    setError(null);

    const result = await updateShelf(shelf.id, formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  }

  if (!shelf) {
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
          { label: "Shelves", href: "/shelves" },
          { label: shelf.name, href: `/shelves/${slug}` },
          { label: "Edit" },
        ]}
      />
      <div className="p-6 max-w-2xl mx-auto w-full">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/shelves/${slug}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shelf
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Edit Shelf</CardTitle>
            <CardDescription>Update the shelf details below.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={shelf.name}
                  placeholder="Enter shelf name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={shelf.description ?? ""}
                  placeholder="Describe what this shelf contains"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={`/shelves/${slug}`}>Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
