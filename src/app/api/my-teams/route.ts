import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, teamMembers } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json([], { status: 401 });
  }

  const memberships = await db.query.teamMembers.findMany({
    where: eq(teamMembers.userId, session.user.id),
    with: {
      team: {
        columns: { id: true, name: true, slug: true },
      },
    },
  });

  const teams = memberships.map((m) => ({
    id: m.team.id,
    name: m.team.name,
    slug: m.team.slug,
    role: m.role,
  }));

  return NextResponse.json(teams);
}
