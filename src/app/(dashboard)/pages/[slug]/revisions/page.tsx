"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, History, Eye, RotateCcw, User, Clock } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface Revision {
  id: string;
  revisionNumber: number;
  content: string;
  html: string | null;
  createdAt: string;
  createdByUser: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
}

interface PageData {
  id: string;
  name: string;
  slug: string;
  revisions: Revision[];
}

export default function RevisionsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    async function fetchRevisions() {
      try {
        const response = await fetch(`/api/pages/${slug}/revisions`);
        if (response.ok) {
          const data = await response.json();
          setPage(data);
        }
      } catch (error) {
        console.error("Failed to fetch revisions:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRevisions();
  }, [slug]);

  async function handleRestore(revisionId: string) {
    setRestoring(true);
    try {
      const response = await fetch(`/api/pages/${slug}/revisions/${revisionId}/restore`, {
        method: "POST",
      });
      if (response.ok) {
        window.location.href = `/pages/${slug}`;
      }
    } catch (error) {
      console.error("Failed to restore revision:", error);
    } finally {
      setRestoring(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header
          breadcrumbs={[
            { label: "Pages", href: "/pages" },
            { label: "Loading..." },
          ]}
        />
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </>
    );
  }

  if (!page) {
    return (
      <>
        <Header
          breadcrumbs={[
            { label: "Pages", href: "/pages" },
            { label: "Not Found" },
          ]}
        />
        <div className="p-6">
          <p className="text-muted-foreground">Page not found.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Pages", href: "/pages" },
          { label: page.name, href: `/pages/${page.slug}` },
          { label: "Revisions" },
        ]}
      />
      <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <History className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Revision History</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {page.revisions.length} revision{page.revisions.length !== 1 ? "s" : ""} for &ldquo;{page.name}&rdquo;
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/pages/${page.slug}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Page
            </Link>
          </Button>
        </div>

        {page.revisions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center py-8">
                No revisions found for this page.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {page.revisions.map((revision, index) => (
              <Card key={revision.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        #{revision.revisionNumber}
                      </Badge>
                      <CardTitle className="text-lg">
                        {index === 0 ? "Current Version" : `Revision ${revision.revisionNumber}`}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRevision(revision)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              Revision #{revision.revisionNumber}
                            </DialogTitle>
                            <DialogDescription>
                              Created {format(new Date(revision.createdAt), "PPpp")}
                              {revision.createdByUser && ` by ${revision.createdByUser.name}`}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4">
                            {revision.html ? (
                              <div
                                className="prose prose-sm dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: revision.html }}
                              />
                            ) : (
                              <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                                {revision.content}
                              </pre>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      {index !== 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(revision.id)}
                          disabled={restoring}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          {restoring ? "Restoring..." : "Restore"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDistanceToNow(new Date(revision.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                    {revision.createdByUser && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {revision.createdByUser.name}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
