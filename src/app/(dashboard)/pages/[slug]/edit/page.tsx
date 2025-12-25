"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { updatePage } from "@/lib/actions/pages";
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EditPageProps {
  params: Promise<{ slug: string }>;
}

interface Page {
  id: string;
  name: string;
  slug: string;
  content: string | null;
  html: string | null;
  draft: boolean;
}

export default function EditPagePage({ params }: EditPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const [page, setPage] = useState<Page | null>(null);
  const [content, setContent] = useState("");
  const [html, setHtml] = useState("");
  const [name, setName] = useState("");
  const [isDraft, setIsDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    async function fetchPage() {
      const response = await fetch(`/api/pages/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setPage(data);
        setName(data.name);
        setIsDraft(data.draft);
        setContent(data.content || "");
        setHtml(data.html || "");
      }
    }
    fetchPage();
  }, [slug]);

  async function handleSubmit(formData: FormData) {
    if (!page) return;
    setIsLoading(true);
    setError(null);

    formData.set("name", name);
    formData.set("content", content);
    formData.set("html", html);
    formData.set("draft", isDraft.toString());

    const result = await updatePage(page.id, formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
      toast.error(result.error);
    } else if (result?.success) {
      toast.success("Page saved successfully");
      router.push(`/pages/${result.slug}`);
    }
  }

  if (!page) {
    return (
      <>
        <Header breadcrumbs={[{ label: "Loading..." }]} />
        <div className="p-6">Loading...</div>
      </>
    );
  }

  // Parse content if it's JSON
  let initialContent = "";
  if (page.content) {
    try {
      initialContent = page.content;
    } catch {
      initialContent = page.html || "";
    }
  }

  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Pages", href: "/pages" },
          { label: page.name, href: `/pages/${slug}` },
          { label: "Edit" },
        ]}
      />
      <div className="p-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/pages/${slug}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Page name"
              className="h-9 w-72"
            />
            <div className="flex items-center gap-2">
              <Switch
                id="draft"
                checked={isDraft}
                onCheckedChange={setIsDraft}
              />
              <Label htmlFor="draft" className="text-sm">Draft</Label>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className={cn(
                "gap-1.5",
                showPreview && "bg-primary/10 text-primary border-primary"
              )}
            >
              {showPreview ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              Preview
            </Button>
            <form action={handleSubmit}>
              <Button type="submit" size="sm" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </form>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        {/* Editor + Preview */}
        <div className="flex gap-6">
          {/* Editor */}
          <div className={cn(
            "transition-all duration-200",
            showPreview ? "w-1/2" : "w-full"
          )}>
            <TiptapEditor
              content={initialContent}
              onChange={(jsonContent, htmlContent) => {
                setContent(jsonContent);
                setHtml(htmlContent);
              }}
              placeholder="Start writing your page content..."
              className="max-h-[600px] overflow-auto"
            />
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="w-1/2 border rounded-lg bg-muted/20 max-h-[600px] overflow-auto">
              <div className="px-4 py-2 border-b bg-muted/50 sticky top-0">
                <span className="text-sm font-medium text-muted-foreground">Preview</span>
              </div>
              <div
                className={cn(
                  "prose prose-sm sm:prose-base dark:prose-invert max-w-none p-6",
                  "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ml-4 [&_ol]:ml-4",
                  "[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:first:mt-0",
                  "[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5",
                  "[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4",
                  "[&_p]:mb-3 [&_p]:leading-relaxed",
                  "[&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4",
                  "[&_table]:w-full [&_table]:border-collapse [&_table]:my-4",
                  "[&_th]:border [&_th]:p-2 [&_th]:bg-muted [&_th]:font-semibold",
                  "[&_td]:border [&_td]:p-2",
                  "[&_img]:rounded-md [&_img]:max-w-full [&_img]:my-4",
                  "[&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono",
                  "[&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-4",
                  "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
                  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
                  "[&_hr]:my-6 [&_hr]:border-border"
                )}
                dangerouslySetInnerHTML={{ __html: html || "<p class='text-muted-foreground'>Start typing to see preview...</p>" }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
