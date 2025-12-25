"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, desc, asc, ilike, or, count } from "drizzle-orm";
import { requireAdmin } from "@/lib/rbac";
import type { UserRole } from "@/lib/rbac";

export async function getUsers(options?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "name" | "email" | "role" | "createdAt";
  sortOrder?: "asc" | "desc";
}) {
  const { authorized, error } = await requireAdmin();
  if (!authorized) {
    return { error, users: [], total: 0 };
  }

  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;
  const offset = (page - 1) * limit;
  const search = options?.search ?? "";
  const sortBy = options?.sortBy ?? "createdAt";
  const sortOrder = options?.sortOrder ?? "desc";

  try {
    const orderByColumn = {
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    }[sortBy];

    const orderFn = sortOrder === "asc" ? asc : desc;

    const whereClause = search
      ? or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      : undefined;

    const [userList, totalResult] = await Promise.all([
      db.query.users.findMany({
        where: whereClause,
        orderBy: [orderFn(orderByColumn)],
        limit,
        offset,
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db
        .select({ count: count() })
        .from(users)
        .where(whereClause),
    ]);

    return {
      users: userList,
      total: totalResult[0]?.count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((totalResult[0]?.count ?? 0) / limit),
    };
  } catch (err) {
    console.error("Error fetching users:", err);
    return { error: "Failed to fetch users", users: [], total: 0 };
  }
}

export async function updateUserRole(userId: string, role: UserRole) {
  const { authorized, session, error } = await requireAdmin();
  if (!authorized) {
    return { error };
  }

  // Prevent admin from changing their own role
  if (session?.user?.id === userId) {
    return { error: "Cannot change your own role" };
  }

  try {
    const [updatedUser] = await db
      .update(users)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      });

    if (!updatedUser) {
      return { error: "User not found" };
    }

    revalidatePath("/admin/users");
    return { success: true, user: updatedUser };
  } catch (err) {
    console.error("Error updating user role:", err);
    return { error: "Failed to update user role" };
  }
}

export async function deleteUser(userId: string) {
  const { authorized, session, error } = await requireAdmin();
  if (!authorized) {
    return { error };
  }

  // Prevent admin from deleting themselves
  if (session?.user?.id === userId) {
    return { error: "Cannot delete your own account" };
  }

  try {
    await db.delete(users).where(eq(users.id, userId));
    revalidatePath("/admin/users");
    return { success: true };
  } catch (err) {
    console.error("Error deleting user:", err);
    return { error: "Failed to delete user" };
  }
}

export async function getUserById(userId: string) {
  const { authorized, error } = await requireAdmin();
  if (!authorized) {
    return { error, user: null };
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return { error: "User not found", user: null };
    }

    return { user };
  } catch (err) {
    console.error("Error fetching user:", err);
    return { error: "Failed to fetch user", user: null };
  }
}
