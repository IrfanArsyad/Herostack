import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if doc-summarizer plugin is installed
    const plugin = await db.query.plugins.findFirst({
      where: eq(schema.plugins.pluginId, "doc-summarizer"),
    });

    if (!plugin || plugin.status !== "active") {
      return NextResponse.json(
        {
          error: "Doc Summarizer plugin is not installed. Please install it from Admin → Plugins.",
        },
        { status: 400 }
      );
    }

    // Plugin is installed but API functionality needs the plugin files
    // This endpoint is a placeholder - actual functionality requires plugin installation
    return NextResponse.json(
      {
        error: "Plugin API not available. Please reinstall the Doc Summarizer plugin.",
      },
      { status: 501 }
    );
  } catch (error) {
    console.error("Summarization error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to summarize" },
      { status: 500 }
    );
  }
}
