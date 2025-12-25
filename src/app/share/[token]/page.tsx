import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicPage } from "@/lib/actions/share";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, FileText, Globe } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PublicPageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicPage({ params }: PublicPageProps) {
  const { token } = await params;
  const page = await getPublicPage(token);

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="p-1.5 bg-primary rounded-md">
                <BookOpen className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">HeroStack</span>
            </Link>
            <Badge variant="secondary" className="gap-1">
              <Globe className="h-3 w-3" />
              Public Page
            </Badge>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{page.name}</h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                {page.createdByUser && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={page.createdByUser.image ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {page.createdByUser.name?.charAt(0)?.toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span>{page.createdByUser.name}</span>
                  </div>
                )}
                <span>•</span>
                <span>
                  Updated{" "}
                  {formatDistanceToNow(new Date(page.updatedAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              {page.book && (
                <p className="text-sm text-muted-foreground mt-1">
                  From: {page.book.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <Card>
          <CardContent className="pt-6">
            {page.html ? (
              <div
                className="prose prose-sm sm:prose-base dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: page.html }}
              />
            ) : (
              <p className="text-muted-foreground italic">
                This page has no content.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>
            Shared via{" "}
            <Link href="/" className="text-primary hover:underline">
              HeroStack
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
