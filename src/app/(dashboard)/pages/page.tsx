import { redirect } from "next/navigation";
import { db, pages, books } from "@/lib/db";
import { desc, eq, or, inArray, isNull, and } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { QuickCreatePage } from "@/components/quick-create";
import { PagesList } from "./pages-list";
import { auth } from "@/lib/auth";
import { getUserTeamIds } from "@/lib/permissions";

async function getPages(userId: string) {
  const teamIds = await getUserTeamIds(userId);

  // First get accessible book IDs
  const bookConditions = [
    and(isNull(books.teamId), eq(books.createdBy, userId)),
  ];

  if (teamIds.length > 0) {
    bookConditions.push(inArray(books.teamId, teamIds));
  }

  const accessibleBooks = await db.query.books.findMany({
    where: or(...bookConditions),
    columns: { id: true },
  });

  const bookIds = accessibleBooks.map((b) => b.id);

  if (bookIds.length === 0) {
    // Also include pages created by user without a book
    return db.query.pages.findMany({
      where: and(isNull(pages.bookId), eq(pages.createdBy, userId)),
      orderBy: [desc(pages.updatedAt)],
      with: {
        book: {
          with: {
            team: { columns: { id: true, name: true } },
          },
        },
      },
    });
  }

  // Get pages from accessible books OR created by user without a book
  return db.query.pages.findMany({
    where: or(
      inArray(pages.bookId, bookIds),
      and(isNull(pages.bookId), eq(pages.createdBy, userId))
    ),
    orderBy: [desc(pages.updatedAt)],
    with: {
      book: {
        with: {
          team: { columns: { id: true, name: true } },
        },
      },
    },
  });
}

export default async function PagesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const allPages = await getPages(session.user.id);

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pages</h1>
        <QuickCreatePage />
      </div>

      {allPages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No pages yet</p>
            <QuickCreatePage />
          </CardContent>
        </Card>
      ) : (
        <PagesList
          pages={allPages.map((page) => ({
            id: page.id,
            name: page.name,
            slug: page.slug,
            draft: page.draft,
            updatedAt: page.updatedAt,
            book: page.book ? { name: page.book.name } : null,
            team: page.book?.team ? { name: page.book.team.name } : null,
          }))}
        />
      )}
    </div>
  );
}
