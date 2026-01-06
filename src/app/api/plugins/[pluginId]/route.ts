import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { eq } from "drizzle-orm";
import { rm } from "fs/promises";
import { existsSync } from "fs";

// Toggle plugin status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pluginId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(session.user.role)) {
    return NextResponse.json(
      { error: "Only administrators can manage plugins" },
      { status: 403 }
    );
  }

  try {
    const { pluginId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !["active", "inactive"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'active' or 'inactive'" },
        { status: 400 }
      );
    }

    const plugin = await db.query.plugins.findFirst({
      where: eq(schema.plugins.pluginId, pluginId),
    });

    if (!plugin) {
      return NextResponse.json({ error: "Plugin not found" }, { status: 404 });
    }

    const [updatedPlugin] = await db
      .update(schema.plugins)
      .set({
        status: status as "active" | "inactive",
        updatedAt: new Date(),
      })
      .where(eq(schema.plugins.pluginId, pluginId))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Plugin "${updatedPlugin.name}" ${status === "active" ? "activated" : "deactivated"} successfully`,
      plugin: {
        id: updatedPlugin.id,
        pluginId: updatedPlugin.pluginId,
        name: updatedPlugin.name,
        status: updatedPlugin.status,
      },
    });
  } catch (err) {
    console.error("Plugin update error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}

// Uninstall plugin
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pluginId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(session.user.role)) {
    return NextResponse.json(
      { error: "Only administrators can uninstall plugins" },
      { status: 403 }
    );
  }

  try {
    const { pluginId } = await params;

    const plugin = await db.query.plugins.findFirst({
      where: eq(schema.plugins.pluginId, pluginId),
    });

    if (!plugin) {
      return NextResponse.json({ error: "Plugin not found" }, { status: 404 });
    }

    // Delete plugin files
    if (plugin.path && existsSync(plugin.path)) {
      await rm(plugin.path, { recursive: true });
    }

    // Delete from database
    await db
      .delete(schema.plugins)
      .where(eq(schema.plugins.pluginId, pluginId));

    return NextResponse.json({
      success: true,
      message: `Plugin "${plugin.name}" uninstalled successfully`,
    });
  } catch (err) {
    console.error("Plugin uninstall error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Uninstall failed" },
      { status: 500 }
    );
  }
}
