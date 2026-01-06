import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ExternalLink, Puzzle } from "lucide-react";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import Link from "next/link";

export default async function SummarizerPage() {
  // Check if doc-summarizer plugin is installed
  const plugin = await db.query.plugins.findFirst({
    where: eq(schema.plugins.pluginId, "doc-summarizer"),
  });

  if (!plugin || plugin.status !== "active") {
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
                The Doc Summarizer plugin is not installed or inactive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This feature requires the Doc Summarizer plugin to be installed.
                The plugin allows you to:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Scrape documentation from any URL</li>
                <li>Summarize content using AI (Google Gemini)</li>
                <li>Automatically generate books with chapters and pages</li>
              </ul>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <a
                    href="https://github.com/IrfanArsyad/herostack-doc-summarizer"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Get the Plugin
                  </a>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href="/admin/plugins">
                    <Puzzle className="mr-2 h-4 w-4" />
                    Manage Plugins
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Plugin is installed - redirect to plugin page or show placeholder
  return (
    <>
      <Header breadcrumbs={[{ label: "Summarize Docs" }]} />
      <div className="p-6 max-w-3xl mx-auto w-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Puzzle className="h-5 w-5" />
              Doc Summarizer
            </CardTitle>
            <CardDescription>
              Plugin is installed. Feature coming soon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The Doc Summarizer plugin is installed and active.
              This page will be enhanced when the plugin UI is loaded.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
