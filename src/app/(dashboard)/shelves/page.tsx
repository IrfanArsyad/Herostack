import { redirect } from "next/navigation";
import { db, shelves } from "@/lib/db";
import { desc, eq, or, inArray, isNull, and } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Library } from "lucide-react";
import { QuickCreateShelf } from "@/components/quick-create";
import { auth } from "@/lib/auth";
import { getUserTeamIds } from "@/lib/permissions";
import { isSuperAdmin } from "@/lib/rbac";
import { ShelvesList } from "./shelves-list";

async function getShelves(userId: string, userRole?: string) {
  // Superadmin can see all shelves
  if (isSuperAdmin(userRole)) {
    return db.query.shelves.findMany({
      orderBy: [desc(shelves.createdAt)],
      with: {
        books: true,
        team: {
          columns: { id: true, name: true, slug: true },
        },
      },
    });
  }

  const teamIds = await getUserTeamIds(userId);

  // Get shelves that:
  // 1. User created personally (no team)
  // 2. Belong to teams the user is a member of
  const conditions = [and(isNull(shelves.teamId), eq(shelves.createdBy, userId))];

  if (teamIds.length > 0) {
    conditions.push(inArray(shelves.teamId, teamIds));
  }

  return db.query.shelves.findMany({
    where: or(...conditions),
    orderBy: [desc(shelves.createdAt)],
    with: {
      books: true,
      team: {
        columns: { id: true, name: true, slug: true },
      },
    },
  });
}

export default async function ShelvesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const allShelves = await getShelves(session.user.id, session.user.role);

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Shelves</h1>
        <QuickCreateShelf />
      </div>

      {allShelves.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Library className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No shelves yet</p>
            <QuickCreateShelf />
          </CardContent>
        </Card>
      ) : (
        <ShelvesList
          shelves={allShelves.map((shelf) => ({
            id: shelf.id,
            name: shelf.name,
            slug: shelf.slug,
            booksCount: shelf.books.length,
            team: shelf.team ? { name: shelf.team.name } : null,
          }))}
        />
      )}
    </div>
  );
}
