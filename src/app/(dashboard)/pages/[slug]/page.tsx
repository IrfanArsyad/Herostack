import { notFound } from "next/navigation";
import Link from "next/link";
import { db, pages } from "@/lib/db";
import { eq } from "drizzle-orm";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  FileText,
  History,
} from "lucide-react";
import { DeletePageButton } from "./delete-button";
import { PageTags } from "./page-tags";
import { formatDistanceToNow } from "date-fns";
import { TableOfContents } from "@/components/table-of-contents";
import { getTagsForEntity } from "@/lib/actions/tags";
import { ExportMenuItems } from "@/components/export/export-menu-items";
import { CommentsSection } from "@/components/comments/comments-section";
import { getComments } from "@/lib/actions/comments";
import { auth } from "@/lib/auth";
import { ShareDialog } from "@/components/share/share-dialog";

interface PageViewProps {
  params: Promise<{ slug: string }>;
}

async function getPage(slug: string) {
  return db.query.pages.findFirst({
    where: eq(pages.slug, slug),
    with: {
      book: {
        with: {
          shelf: true,
        },
      },
      chapter: true,
      createdByUser: true,
      revisions: {
        orderBy: (revisions, { desc }) => [desc(revisions.revisionNumber)],
        limit: 1,
      },
    },
  });
}

export default async function PageView({ params }: PageViewProps) {
  const { slug } = await params;
  const [page, session] = await Promise.all([getPage(slug), auth()]);

  if (!page) {
    notFound();
  }

  const [pageTags, pageComments] = await Promise.all([
    getTagsForEntity(page.id, "page"),
    getComments(page.id),
  ]);

  const currentUser = session?.user
    ? { id: session.user.id, name: session.user.name, image: session.user.image }
    : null;

  const breadcrumbs: { label: string; href?: string }[] = [
    { label: "Pages", href: "/pages" },
  ];
  if (page.book) {
    breadcrumbs.push({
      label: page.book.name,
      href: `/books/${page.book.slug}`,
    });
  }
  if (page.chapter) {
    breadcrumbs.push({
      label: page.chapter.name,
      href: `/chapters/${page.chapter.slug}`,
    });
  }
  breadcrumbs.push({ label: page.name });

  return (
    <>
      <Header breadcrumbs={breadcrumbs} />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header section */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold">{page.name}</h1>
                  {page.draft && <Badge variant="outline">Draft</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Last updated{" "}
                  {formatDistanceToNow(new Date(page.updatedAt), {
                    addSuffix: true,
                  })}
                  {page.createdByUser && ` by ${page.createdByUser.name}`}
                </p>
                <div className="mt-2">
                  <PageTags pageId={page.id} initialTags={pageTags} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ShareDialog
                pageId={page.id}
                pageName={page.name}
                initialIsPublic={page.isPublic}
                initialShareToken={page.shareToken}
              />
              <Button asChild>
                <Link href={`/pages/${page.slug}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/pages/${page.slug}/revisions`}>
                      <History className="mr-2 h-4 w-4" />
                      Revision History
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <ExportMenuItems type="page" slug={page.slug} />
                  <DropdownMenuSeparator />
                  <DeletePageButton pageId={page.id} />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Content with sidebar */}
          <div className="flex gap-8">
            {/* Main content */}
            <div className="flex-1 min-w-0">
              <Card>
                <CardContent className="pt-6">
                  {page.html ? (
                    <div
                      className="prose prose-sm sm:prose-base dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: page.html }}
                    />
                  ) : (
                    <p className="text-muted-foreground italic">
                      This page has no content yet.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Comments Section */}
              <CommentsSection
                pageId={page.id}
                initialComments={pageComments}
                currentUser={currentUser}
              />
            </div>

            {/* Right sidebar - Table of Contents */}
            {page.html && (
              <aside className="hidden xl:block w-64 shrink-0">
                <div className="sticky top-6">
                  <TableOfContents html={page.html} />
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
