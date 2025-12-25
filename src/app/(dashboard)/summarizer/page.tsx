"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileSearch, ExternalLink } from "lucide-react";
import type { GeneratedBook } from "../../../../plugins/doc-summarizer/types";

// Dynamic imports for plugin components
let SummarizerForm: React.ComponentType<{ onSummarize: (book: GeneratedBook) => void }> | null = null;
let SummarizerPreview: React.ComponentType<{ book: GeneratedBook; onBack: () => void }> | null = null;

export default function SummarizerPage() {
  const [isPluginLoaded, setIsPluginLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [generatedBook, setGeneratedBook] = useState<GeneratedBook | null>(null);

  useEffect(() => {
    async function loadPlugin() {
      try {
        const formModule = await import("../../../../plugins/doc-summarizer/components/summarizer-form");
        const previewModule = await import("../../../../plugins/doc-summarizer/components/summarizer-preview");

        SummarizerForm = formModule.SummarizerForm;
        SummarizerPreview = previewModule.SummarizerPreview;
        setIsPluginLoaded(true);
      } catch (error) {
        console.error("Plugin not loaded:", error);
        setIsPluginLoaded(false);
      } finally {
        setIsLoading(false);
      }
    }

    loadPlugin();
  }, []);

  if (isLoading) {
    return (
      <>
        <Header breadcrumbs={[{ label: "Summarize Docs" }]} />
        <div className="p-6 max-w-3xl mx-auto w-full">
          <Card>
            <CardContent className="py-8">
              <div className="flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading plugin...</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (!isPluginLoaded) {
    return (
      <>
        <Header breadcrumbs={[{ label: "Summarize Docs" }]} />
        <div className="p-6 max-w-3xl mx-auto w-full">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Plugin Not Installed
              </CardTitle>
              <CardDescription>
                The Doc Summarizer plugin is not installed in your application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This feature requires the Doc Summarizer plugin to be installed.
                The plugin allows you to:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Scrape documentation from any URL</li>
                <li>Summarize content using AI (OpenAI)</li>
                <li>Automatically generate books with chapters and pages</li>
              </ul>
              <Button variant="outline" asChild>
                <a href="https://example.com/plugins/doc-summarizer" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Get the Plugin
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Header breadcrumbs={[{ label: "Summarize Docs" }]} />
      <div className="p-6 max-w-3xl mx-auto w-full">
        {generatedBook ? (
          SummarizerPreview && (
            <SummarizerPreview
              book={generatedBook}
              onBack={() => setGeneratedBook(null)}
            />
          )
        ) : (
          SummarizerForm && (
            <SummarizerForm onSummarize={(book) => setGeneratedBook(book)} />
          )
        )}
      </div>
    </>
  );
}
