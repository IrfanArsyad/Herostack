import { db, teamMembers } from "@/lib/db";
import { eq } from "drizzle-orm";

/**
 * Get all team IDs that a user is a member of
 */
export async function getUserTeamIds(userId: string): Promise<string[]> {
  const memberships = await db.query.teamMembers.findMany({
    where: eq(teamMembers.userId, userId),
    columns: { teamId: true },
  });

  return memberships.map((m) => m.teamId);
}

/**
 * Check if a user can access content from a specific team
 */
export async function canAccessTeam(
  userId: string,
  teamId: string
): Promise<boolean> {
  const membership = await db.query.teamMembers.findFirst({
    where: (tm, { and, eq }) =>
      and(eq(tm.userId, userId), eq(tm.teamId, teamId)),
  });

  return !!membership;
}

/**
 * Check if user can manage a team (owner or admin)
 */
export async function canManageTeam(
  userId: string,
  teamId: string
): Promise<boolean> {
  const membership = await db.query.teamMembers.findFirst({
    where: (tm, { and, eq }) =>
      and(eq(tm.userId, userId), eq(tm.teamId, teamId)),
  });

  return membership?.role === "owner" || membership?.role === "admin";
}
