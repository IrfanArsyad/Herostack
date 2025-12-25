import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

export type UserRole = "admin" | "editor" | "viewer";

export type Permission =
  | "shelves:create"
  | "shelves:edit"
  | "shelves:delete"
  | "shelves:view"
  | "books:create"
  | "books:edit"
  | "books:delete"
  | "books:view"
  | "chapters:create"
  | "chapters:edit"
  | "chapters:delete"
  | "chapters:view"
  | "pages:create"
  | "pages:edit"
  | "pages:delete"
  | "pages:view"
  | "users:manage"
  | "tags:manage";

const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    "shelves:create",
    "shelves:edit",
    "shelves:delete",
    "shelves:view",
    "books:create",
    "books:edit",
    "books:delete",
    "books:view",
    "chapters:create",
    "chapters:edit",
    "chapters:delete",
    "chapters:view",
    "pages:create",
    "pages:edit",
    "pages:delete",
    "pages:view",
    "users:manage",
    "tags:manage",
  ],
  editor: [
    "shelves:create",
    "shelves:edit",
    "shelves:view",
    "books:create",
    "books:edit",
    "books:view",
    "chapters:create",
    "chapters:edit",
    "chapters:view",
    "pages:create",
    "pages:edit",
    "pages:view",
    "tags:manage",
  ],
  viewer: [
    "shelves:view",
    "books:view",
    "chapters:view",
    "pages:view",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function getPermissions(role: UserRole): Permission[] {
  return rolePermissions[role] ?? [];
}

export function isAdmin(role: string | undefined): boolean {
  return role === "admin";
}

export function isEditor(role: string | undefined): boolean {
  return role === "editor" || role === "admin";
}

export function canCreate(role: string | undefined): boolean {
  return role === "admin" || role === "editor";
}

export function canEdit(role: string | undefined): boolean {
  return role === "admin" || role === "editor";
}

export function canDelete(role: string | undefined): boolean {
  return role === "admin";
}

export async function requirePermission(permission: Permission): Promise<{
  authorized: boolean;
  session: Session | null;
  error?: string;
}> {
  const session = await auth();

  if (!session?.user?.id) {
    return { authorized: false, session, error: "Unauthorized" };
  }

  const userRole = (session.user.role as UserRole) || "viewer";

  if (!hasPermission(userRole, permission)) {
    return { authorized: false, session, error: "Permission denied" };
  }

  return { authorized: true, session };
}

export async function requireAuth(): Promise<{
  authorized: boolean;
  session: Session | null;
  error?: string;
}> {
  const session = await auth();

  if (!session?.user?.id) {
    return { authorized: false, session, error: "Unauthorized" };
  }

  return { authorized: true, session };
}

export async function requireAdmin(): Promise<{
  authorized: boolean;
  session: Session | null;
  error?: string;
}> {
  const session = await auth();

  if (!session?.user?.id) {
    return { authorized: false, session, error: "Unauthorized" };
  }

  if (!isAdmin(session.user.role)) {
    return { authorized: false, session, error: "Admin access required" };
  }

  return { authorized: true, session };
}
