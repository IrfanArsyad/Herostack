import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { desc } from "drizzle-orm";
import * as schema from "@/lib/db/schema";

export async function GET() {
  // Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admin can view all plugins
  if (!isAdmin(session.user.role)) {
    return NextResponse.json(
      { error: "Only administrators can manage plugins" },
      { status: 403 }
    );
  }

  try {
    const plugins = await db.query.plugins.findMany({
      orderBy: [desc(schema.plugins.installedAt)],
    });

    return NextResponse.json({
      plugins: plugins.map((p) => ({
        id: p.id,
        pluginId: p.pluginId,
        name: p.name,
        version: p.version,
        description: p.description,
        author: p.author,
        status: p.status,
        menuItems: p.menuItems ? JSON.parse(p.menuItems) : [],
        installedAt: p.installedAt,
      })),
    });
  } catch (err) {
    console.error("Error fetching plugins:", err);
    return NextResponse.json(
      { error: "Failed to fetch plugins" },
      { status: 500 }
    );
  }
}
