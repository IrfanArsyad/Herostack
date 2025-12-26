import { notFound, redirect } from "next/navigation";
import { db, teams } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, Link as LinkIcon, Users } from "lucide-react";
import { InvitationsManager } from "./invitations-manager";
import { MembersManager } from "./members-manager";
import { TeamSettingsForm } from "./team-settings-form";
import { getTeamInvitations } from "@/lib/actions/teams";

interface TeamSettingsPageProps {
  params: Promise<{ slug: string }>;
}

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
    },
  });

  if (!team) return null;

  const membership = team.members.find((m) => m.userId === userId);
  return {
    ...team,
    myRole: membership?.role || null,
  };
}

export default async function TeamSettingsPage({ params }: TeamSettingsPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { slug } = await params;
  const team = await getTeam(slug, session.user.id);

  if (!team) {
    notFound();
  }

  const canManage =
    team.myRole === "owner" ||
    team.myRole === "admin" ||
    session.user.role === "admin";

  if (!canManage) {
    redirect(`/teams/${slug}`);
  }

  const invitationsResult = await getTeamInvitations(team.id);

  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Teams", href: "/teams" },
          { label: team.name, href: `/teams/${team.slug}` },
          { label: "Settings" },
        ]}
      />
      <div className="p-6 space-y-6 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Team Settings</h1>
        </div>

        {/* Team Info */}
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Update team name and description</CardDescription>
          </CardHeader>
          <CardContent>
            <TeamSettingsForm
              teamId={team.id}
              initialName={team.name}
              initialDescription={team.description || ""}
            />
          </CardContent>
        </Card>

        {/* Invitation Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Invitation Links
            </CardTitle>
            <CardDescription>
              Create and manage invitation links for your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InvitationsManager
              teamId={team.id}
              invitations={invitationsResult.invitations || []}
            />
          </CardContent>
        </Card>

        {/* Members Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members
            </CardTitle>
            <CardDescription>
              Manage team members and their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MembersManager
              teamId={team.id}
              members={team.members}
              currentUserId={session.user.id}
              isOwner={team.myRole === "owner"}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
