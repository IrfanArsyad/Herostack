import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { eq } from "drizzle-orm";

export interface IPWhitelistSettings {
  enabled: boolean;
  mode: "whitelist" | "blacklist";
  ips: string[];
  allowLocalhost: boolean;
  blockedMessage: string;
}

const DEFAULT_SETTINGS: IPWhitelistSettings = {
  enabled: false,
  mode: "whitelist",
  ips: [],
  allowLocalhost: true,
  blockedMessage: "Access denied. Your IP is not whitelisted.",
};

// Get IP whitelist settings
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(session.user.role)) {
    return NextResponse.json(
      { error: "Only administrators can access this" },
      { status: 403 }
    );
  }

  try {
    const plugin = await db.query.plugins.findFirst({
      where: eq(schema.plugins.pluginId, "ip-whitelist"),
    });

    if (!plugin) {
      return NextResponse.json(
        { error: "IP Whitelist plugin is not installed" },
        { status: 404 }
      );
    }

    const settings: IPWhitelistSettings = plugin.settings
      ? JSON.parse(plugin.settings)
      : DEFAULT_SETTINGS;

    return NextResponse.json({
      settings,
      pluginStatus: plugin.status,
    });
  } catch (err) {
    console.error("Error fetching IP whitelist settings:", err);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// Update IP whitelist settings
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(session.user.role)) {
    return NextResponse.json(
      { error: "Only administrators can modify this" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const settings: IPWhitelistSettings = {
      enabled: Boolean(body.enabled),
      mode: body.mode === "blacklist" ? "blacklist" : "whitelist",
      ips: Array.isArray(body.ips) ? body.ips.filter((ip: string) => ip.trim()) : [],
      allowLocalhost: body.allowLocalhost !== false,
      blockedMessage: body.blockedMessage || DEFAULT_SETTINGS.blockedMessage,
    };

    const plugin = await db.query.plugins.findFirst({
      where: eq(schema.plugins.pluginId, "ip-whitelist"),
    });

    if (!plugin) {
      return NextResponse.json(
        { error: "IP Whitelist plugin is not installed" },
        { status: 404 }
      );
    }

    await db
      .update(schema.plugins)
      .set({
        settings: JSON.stringify(settings),
        updatedAt: new Date(),
      })
      .where(eq(schema.plugins.pluginId, "ip-whitelist"));

    return NextResponse.json({
      success: true,
      message: "IP whitelist settings updated",
      settings,
    });
  } catch (err) {
    console.error("Error updating IP whitelist settings:", err);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
