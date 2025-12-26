"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, desc, like, or, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

// Get all teams for current user
export async function getMyTeams() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const memberships = await db.query.teamMembers.findMany({
      where: eq(schema.teamMembers.userId, session.user.id),
      with: {
        team: {
          with: {
            members: {
              with: {
                user: {
                  columns: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      teams: memberships.map((m) => ({
        ...m.team,
        myRole: m.role,
        memberCount: m.team.members.length,
      })),
    };
  } catch (error) {
    console.error("Error fetching teams:", error);
    return { error: "Failed to fetch teams" };
  }
}

// Get all teams (admin only)
export async function getAllTeams({
  page = 1,
  limit = 10,
  search = "",
}: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const { authorized, error } = await requirePermission("admin");
  if (!authorized) {
    return { error };
  }

  try {
    const offset = (page - 1) * limit;

    const whereCondition = search
      ? or(
          like(schema.teams.name, `%${search}%`),
          like(schema.teams.slug, `%${search}%`)
        )
      : undefined;

    const [teams, countResult] = await Promise.all([
      db.query.teams.findMany({
        where: whereCondition,
        orderBy: [desc(schema.teams.createdAt)],
        limit,
        offset,
        with: {
          members: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          createdByUser: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(schema.teams)
        .where(whereCondition),
    ]);

    const total = Number(countResult[0]?.count || 0);

    return {
      teams,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Error fetching teams:", error);
    return { error: "Failed to fetch teams" };
  }
}

// Get team by ID
export async function getTeam(teamId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const team = await db.query.teams.findFirst({
      where: eq(schema.teams.id, teamId),
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

    if (!team) {
      return { error: "Team not found" };
    }

    // Check if user is member or admin
    const isMember = team.members.some((m) => m.userId === session.user!.id);
    const isAdmin = session.user.role === "admin";

    if (!isMember && !isAdmin) {
      return { error: "Access denied" };
    }

    const myMembership = team.members.find((m) => m.userId === session.user!.id);

    return {
      team: {
        ...team,
        myRole: myMembership?.role || null,
      },
    };
  } catch (error) {
    console.error("Error fetching team:", error);
    return { error: "Failed to fetch team" };
  }
}

// Create team
export async function createTeam(data: { name: string; description?: string }) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  // Any logged in user can create a team
  try {
    const slug = generateSlug(data.name);

    // Check if slug exists
    const existing = await db.query.teams.findFirst({
      where: eq(schema.teams.slug, slug),
    });

    const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

    const [team] = await db
      .insert(schema.teams)
      .values({
        name: data.name,
        slug: finalSlug,
        description: data.description || null,
        createdBy: session.user.id,
      })
      .returning();

    // Add creator as owner
    await db.insert(schema.teamMembers).values({
      teamId: team.id,
      userId: session.user.id,
      role: "owner",
    });

    revalidatePath("/teams");

    return { success: true, team };
  } catch (error) {
    console.error("Error creating team:", error);
    return { error: "Failed to create team" };
  }
}

// Update team
export async function updateTeam(
  teamId: string,
  data: { name?: string; description?: string }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    // Check if user is team owner/admin
    const membership = await db.query.teamMembers.findFirst({
      where: and(
        eq(schema.teamMembers.teamId, teamId),
        eq(schema.teamMembers.userId, session.user.id)
      ),
    });

    const isSystemAdmin = session.user.role === "admin";
    const isTeamAdmin = membership?.role === "owner" || membership?.role === "admin";

    if (!isSystemAdmin && !isTeamAdmin) {
      return { error: "Access denied" };
    }

    const updateData: Partial<typeof schema.teams.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.name) {
      updateData.name = data.name;
      updateData.slug = generateSlug(data.name);
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    const [team] = await db
      .update(schema.teams)
      .set(updateData)
      .where(eq(schema.teams.id, teamId))
      .returning();

    revalidatePath("/teams");
    revalidatePath(`/teams/${team.slug}`);

    return { success: true, team };
  } catch (error) {
    console.error("Error updating team:", error);
    return { error: "Failed to update team" };
  }
}

// Delete team
export async function deleteTeam(teamId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    // Check if user is team owner or system admin
    const membership = await db.query.teamMembers.findFirst({
      where: and(
        eq(schema.teamMembers.teamId, teamId),
        eq(schema.teamMembers.userId, session.user.id)
      ),
    });

    const isSystemAdmin = session.user.role === "admin";
    const isTeamOwner = membership?.role === "owner";

    if (!isSystemAdmin && !isTeamOwner) {
      return { error: "Only team owners can delete teams" };
    }

    await db.delete(schema.teams).where(eq(schema.teams.id, teamId));

    revalidatePath("/teams");

    return { success: true };
  } catch (error) {
    console.error("Error deleting team:", error);
    return { error: "Failed to delete team" };
  }
}

// Add member to team
export async function addTeamMember(
  teamId: string,
  userId: string,
  role: "admin" | "member" = "member"
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    // Check if requester is team owner/admin
    const membership = await db.query.teamMembers.findFirst({
      where: and(
        eq(schema.teamMembers.teamId, teamId),
        eq(schema.teamMembers.userId, session.user.id)
      ),
    });

    const isSystemAdmin = session.user.role === "admin";
    const isTeamAdmin = membership?.role === "owner" || membership?.role === "admin";

    if (!isSystemAdmin && !isTeamAdmin) {
      return { error: "Access denied" };
    }

    // Check if user already member
    const existing = await db.query.teamMembers.findFirst({
      where: and(
        eq(schema.teamMembers.teamId, teamId),
        eq(schema.teamMembers.userId, userId)
      ),
    });

    if (existing) {
      return { error: "User is already a member" };
    }

    await db.insert(schema.teamMembers).values({
      teamId,
      userId,
      role,
    });

    revalidatePath("/teams");

    return { success: true };
  } catch (error) {
    console.error("Error adding team member:", error);
    return { error: "Failed to add member" };
  }
}

// Remove member from team
export async function removeTeamMember(teamId: string, userId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    // Check if requester is team owner/admin
    const membership = await db.query.teamMembers.findFirst({
      where: and(
        eq(schema.teamMembers.teamId, teamId),
        eq(schema.teamMembers.userId, session.user.id)
      ),
    });

    const isSystemAdmin = session.user.role === "admin";
    const isTeamAdmin = membership?.role === "owner" || membership?.role === "admin";
    const isSelf = userId === session.user.id;

    if (!isSystemAdmin && !isTeamAdmin && !isSelf) {
      return { error: "Access denied" };
    }

    // Check if trying to remove the only owner
    const targetMembership = await db.query.teamMembers.findFirst({
      where: and(
        eq(schema.teamMembers.teamId, teamId),
        eq(schema.teamMembers.userId, userId)
      ),
    });

    if (targetMembership?.role === "owner") {
      const ownerCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.teamMembers)
        .where(
          and(
            eq(schema.teamMembers.teamId, teamId),
            eq(schema.teamMembers.role, "owner")
          )
        );

      if (Number(ownerCount[0]?.count) <= 1) {
        return { error: "Cannot remove the only owner. Transfer ownership first." };
      }
    }

    await db
      .delete(schema.teamMembers)
      .where(
        and(
          eq(schema.teamMembers.teamId, teamId),
          eq(schema.teamMembers.userId, userId)
        )
      );

    revalidatePath("/teams");

    return { success: true };
  } catch (error) {
    console.error("Error removing team member:", error);
    return { error: "Failed to remove member" };
  }
}

// Update member role
export async function updateTeamMemberRole(
  teamId: string,
  userId: string,
  newRole: "owner" | "admin" | "member"
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    // Check if requester is team owner
    const membership = await db.query.teamMembers.findFirst({
      where: and(
        eq(schema.teamMembers.teamId, teamId),
        eq(schema.teamMembers.userId, session.user.id)
      ),
    });

    const isSystemAdmin = session.user.role === "admin";
    const isTeamOwner = membership?.role === "owner";

    if (!isSystemAdmin && !isTeamOwner) {
      return { error: "Only team owners can change roles" };
    }

    await db
      .update(schema.teamMembers)
      .set({ role: newRole })
      .where(
        and(
          eq(schema.teamMembers.teamId, teamId),
          eq(schema.teamMembers.userId, userId)
        )
      );

    revalidatePath("/teams");

    return { success: true };
  } catch (error) {
    console.error("Error updating member role:", error);
    return { error: "Failed to update role" };
  }
}

// ============ INVITATION FUNCTIONS ============

function generateInviteToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Create invitation link
export async function createTeamInvitation(
  teamId: string,
  options?: {
    role?: "admin" | "member";
    maxUses?: number;
    expiresInDays?: number;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    // Check if user can manage team
    const membership = await db.query.teamMembers.findFirst({
      where: and(
        eq(schema.teamMembers.teamId, teamId),
        eq(schema.teamMembers.userId, session.user.id)
      ),
    });

    const isSystemAdmin = session.user.role === "admin";
    const isTeamAdmin = membership?.role === "owner" || membership?.role === "admin";

    if (!isSystemAdmin && !isTeamAdmin) {
      return { error: "Access denied" };
    }

    const token = generateInviteToken();
    const expiresAt = options?.expiresInDays
      ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const [invitation] = await db
      .insert(schema.teamInvitations)
      .values({
        teamId,
        token,
        role: options?.role || "member",
        maxUses: options?.maxUses || null,
        expiresAt,
        createdBy: session.user.id,
      })
      .returning();

    revalidatePath("/teams");

    return {
      success: true,
      invitation: {
        ...invitation,
        inviteUrl: `/invite/${invitation.token}`,
      },
    };
  } catch (error) {
    console.error("Error creating invitation:", error);
    return { error: "Failed to create invitation" };
  }
}

// Get team invitations
export async function getTeamInvitations(teamId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    // Check if user can view team
    const membership = await db.query.teamMembers.findFirst({
      where: and(
        eq(schema.teamMembers.teamId, teamId),
        eq(schema.teamMembers.userId, session.user.id)
      ),
    });

    const isSystemAdmin = session.user.role === "admin";
    const isTeamAdmin = membership?.role === "owner" || membership?.role === "admin";

    if (!isSystemAdmin && !isTeamAdmin) {
      return { error: "Access denied" };
    }

    const invitations = await db.query.teamInvitations.findMany({
      where: eq(schema.teamInvitations.teamId, teamId),
      orderBy: [desc(schema.teamInvitations.createdAt)],
      with: {
        createdByUser: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return { invitations };
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return { error: "Failed to fetch invitations" };
  }
}

// Delete invitation
export async function deleteTeamInvitation(invitationId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const invitation = await db.query.teamInvitations.findFirst({
      where: eq(schema.teamInvitations.id, invitationId),
    });

    if (!invitation) {
      return { error: "Invitation not found" };
    }

    // Check if user can manage team
    const membership = await db.query.teamMembers.findFirst({
      where: and(
        eq(schema.teamMembers.teamId, invitation.teamId),
        eq(schema.teamMembers.userId, session.user.id)
      ),
    });

    const isSystemAdmin = session.user.role === "admin";
    const isTeamAdmin = membership?.role === "owner" || membership?.role === "admin";

    if (!isSystemAdmin && !isTeamAdmin) {
      return { error: "Access denied" };
    }

    await db
      .delete(schema.teamInvitations)
      .where(eq(schema.teamInvitations.id, invitationId));

    revalidatePath("/teams");

    return { success: true };
  } catch (error) {
    console.error("Error deleting invitation:", error);
    return { error: "Failed to delete invitation" };
  }
}

// Accept invitation (used by the invite page)
export async function acceptTeamInvitation(token: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Please login first", requiresAuth: true };
  }

  try {
    const invitation = await db.query.teamInvitations.findFirst({
      where: eq(schema.teamInvitations.token, token),
      with: {
        team: true,
      },
    });

    if (!invitation) {
      return { error: "Invalid invitation link" };
    }

    // Check if expired
    if (invitation.expiresAt && new Date() > invitation.expiresAt) {
      return { error: "This invitation has expired" };
    }

    // Check if max uses reached
    if (invitation.maxUses && invitation.uses >= invitation.maxUses) {
      return { error: "This invitation has reached its usage limit" };
    }

    // Check if user already member
    const existingMember = await db.query.teamMembers.findFirst({
      where: and(
        eq(schema.teamMembers.teamId, invitation.teamId),
        eq(schema.teamMembers.userId, session.user.id)
      ),
    });

    if (existingMember) {
      return {
        error: "You are already a member of this team",
        teamSlug: invitation.team.slug,
      };
    }

    // Add user to team
    await db.insert(schema.teamMembers).values({
      teamId: invitation.teamId,
      userId: session.user.id,
      role: invitation.role,
    });

    // Increment uses
    await db
      .update(schema.teamInvitations)
      .set({ uses: invitation.uses + 1 })
      .where(eq(schema.teamInvitations.id, invitation.id));

    revalidatePath("/teams");

    return {
      success: true,
      teamName: invitation.team.name,
      teamSlug: invitation.team.slug,
    };
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return { error: "Failed to join team" };
  }
}

// Get invitation info (for invite page, no auth required)
export async function getInvitationInfo(token: string) {
  try {
    const invitation = await db.query.teamInvitations.findFirst({
      where: eq(schema.teamInvitations.token, token),
      with: {
        team: {
          columns: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
      },
    });

    if (!invitation) {
      return { error: "Invalid invitation link" };
    }

    // Check if expired
    if (invitation.expiresAt && new Date() > invitation.expiresAt) {
      return { error: "This invitation has expired" };
    }

    // Check if max uses reached
    if (invitation.maxUses && invitation.uses >= invitation.maxUses) {
      return { error: "This invitation has reached its usage limit" };
    }

    return {
      team: invitation.team,
      role: invitation.role,
    };
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return { error: "Failed to fetch invitation" };
  }
}
