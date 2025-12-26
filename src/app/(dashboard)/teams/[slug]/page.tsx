import { notFound } from "next/navigation";
import Link from "next/link";
import { db, teams } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  Settings,
  Library,
  BookMarked,
  Crown,
  Shield,
  User,
  UserPlus,
  Plus,
} from "lucide-react";
import { AddMemberDialog } from "./add-member-dialog";
import { QuickCreateShelf, QuickCreateBook } from "@/components/quick-create";

interface TeamPageProps {
  params: Promise<{ slug: string }>;
}

const roleIcons = {
  owner: Crown,
  admin: Shield,
  member: User,
};

const roleColors = {
  owner: "text-yellow-600",
  admin: "text-blue-600",
  member: "text-gray-600",
};

async function getTeam(slug: string, userId: string) {
  const team = await db.query.teams.findFirst({
    where: eq(teams.slug, slug),
    with: {
      members: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          },
        },
      },
      shelves: true,
      books: true,
      createdByUser: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!team) return null;

  // Check if user is member
  const membership = team.members.find((m) => m.userId === userId);

  return {
    ...team,
    myRole: membership?.role || null,
  };
}

export default async function TeamPage({ params }: TeamPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    notFound();
  }

  const { slug } = await params;
  const team = await getTeam(slug, session.user.id);

  if (!team) {
    notFound();
  }

  // Check access
  const isMember = team.myRole !== null;
  const isAdmin = session.user.role === "admin";

  if (!isMember && !isAdmin) {
    notFound();
  }

  const canManage = team.myRole === "owner" || team.myRole === "admin" || isAdmin;

  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Teams", href: "/teams" },
          { label: team.name },
        ]}
      />
      <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{team.name}</h1>
                {team.myRole && (
                  <Badge variant="outline">
                    {team.myRole.charAt(0).toUpperCase() + team.myRole.slice(1)}
                  </Badge>
                )}
              </div>
              {team.description && (
                <p className="text-muted-foreground mt-1">{team.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <QuickCreateShelf
              defaultTeamId={team.id}
              trigger={
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New Shelf
                </Button>
              }
            />
            <QuickCreateBook
              defaultTeamId={team.id}
              trigger={
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New Book
                </Button>
              }
            />
            {canManage && (
              <>
                <AddMemberDialog teamId={team.id} />
                <Button variant="outline" asChild>
                  <Link href={`/teams/${team.slug}/settings`}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Members */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members ({team.members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {team.members
                  .sort((a, b) => {
                    const order = { owner: 0, admin: 1, member: 2 };
                    return order[a.role] - order[b.role];
                  })
                  .map((member) => {
                    const RoleIcon = roleIcons[member.role];
                    return (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={member.user.image || undefined} />
                            <AvatarFallback>
                              {member.user.name?.[0] || member.user.email?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {member.user.name || member.user.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.user.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${roleColors[member.role]}`}
                          >
                            <RoleIcon className="h-3 w-3 mr-1" />
                            {member.role.charAt(0).toUpperCase() +
                              member.role.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="space-y-4">
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded">
                    <Library className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{team.shelves.length}</p>
                    <p className="text-sm text-muted-foreground">Shelves</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded">
                    <BookMarked className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{team.books.length}</p>
                    <p className="text-sm text-muted-foreground">Books</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Team Content */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Team Content</h2>

          {team.shelves.length === 0 && team.books.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Library className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">
                  No content yet. Create your first shelf or book for this team.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <QuickCreateShelf
                    defaultTeamId={team.id}
                    trigger={
                      <Button variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        New Shelf
                      </Button>
                    }
                  />
                  <QuickCreateBook
                    defaultTeamId={team.id}
                    trigger={
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Book
                      </Button>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {(team.shelves.length > 0 || team.books.length > 0) && (
            <>

            {team.shelves.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Shelves
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {team.shelves.map((shelf) => (
                    <Card key={shelf.id} className="hover:bg-muted/50">
                      <CardContent className="py-3 px-4">
                        <Link
                          href={`/shelves/${shelf.slug}`}
                          className="flex items-center gap-3"
                        >
                          <Library className="h-4 w-4 text-purple-500" />
                          <span className="font-medium text-sm">
                            {shelf.name}
                          </span>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {team.books.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Books
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {team.books.map((book) => (
                    <Card key={book.id} className="hover:bg-muted/50">
                      <CardContent className="py-3 px-4">
                        <Link
                          href={`/books/${book.slug}`}
                          className="flex items-center gap-3"
                        >
                          <BookMarked className="h-4 w-4 text-blue-500" />
                          <span className="font-medium text-sm">
                            {book.name}
                          </span>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
