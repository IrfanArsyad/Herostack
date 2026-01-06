import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { writeFile, mkdir, rm } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { eq } from "drizzle-orm";

interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  main?: string;
  menuItems?: Array<{
    title: string;
    href: string;
    icon?: string;
  }>;
}

const PLUGINS_DIR = path.join(process.cwd(), "plugins");

// Validate plugin manifest structure
function validateManifest(manifest: unknown): { valid: boolean; error?: string } {
  if (!manifest || typeof manifest !== "object") {
    return { valid: false, error: "Manifest must be a valid JSON object" };
  }

  const m = manifest as Record<string, unknown>;

  // Required fields
  if (!m.id || typeof m.id !== "string") {
    return { valid: false, error: "Manifest must have a valid 'id' field (string)" };
  }

  if (!m.name || typeof m.name !== "string") {
    return { valid: false, error: "Manifest must have a valid 'name' field (string)" };
  }

  if (!m.version || typeof m.version !== "string") {
    return { valid: false, error: "Manifest must have a valid 'version' field (string)" };
  }

  // Validate id format (alphanumeric with hyphens only)
  if (!/^[a-z0-9-]+$/.test(m.id)) {
    return { valid: false, error: "Plugin id must contain only lowercase letters, numbers, and hyphens" };
  }

  // Validate version format (semver-like)
  if (!/^\d+\.\d+\.\d+/.test(m.version)) {
    return { valid: false, error: "Version must be in semver format (e.g., 1.0.0)" };
  }

  // Optional fields validation
  if (m.description !== undefined && typeof m.description !== "string") {
    return { valid: false, error: "'description' must be a string" };
  }

  if (m.author !== undefined && typeof m.author !== "string") {
    return { valid: false, error: "'author' must be a string" };
  }

  // Validate menuItems if present
  if (m.menuItems !== undefined) {
    if (!Array.isArray(m.menuItems)) {
      return { valid: false, error: "'menuItems' must be an array" };
    }

    for (let i = 0; i < m.menuItems.length; i++) {
      const item = m.menuItems[i] as Record<string, unknown>;
      if (!item.title || typeof item.title !== "string") {
        return { valid: false, error: `menuItems[${i}] must have a valid 'title' field` };
      }
      if (!item.href || typeof item.href !== "string") {
        return { valid: false, error: `menuItems[${i}] must have a valid 'href' field` };
      }
    }
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admin can install plugins
  if (!isAdmin(session.user.role)) {
    return NextResponse.json(
      { error: "Only administrators can install plugins" },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith(".zip")) {
      return NextResponse.json(
        { error: "File must be a ZIP archive" },
        { status: 400 }
      );
    }

    // Read the ZIP file
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Look for plugin.json manifest
    let manifest: PluginManifest | null = null;
    let rootDir = "";

    // Check for plugin.json at root or in a subdirectory
    const manifestFile =
      zip.file("plugin.json") ||
      Object.values(zip.files).find((f) => f.name.endsWith("/plugin.json"));

    if (manifestFile) {
      const content = await manifestFile.async("string");

      // Safe JSON parsing with try-catch
      let parsedManifest: unknown;
      try {
        parsedManifest = JSON.parse(content);
      } catch {
        return NextResponse.json(
          { error: "Invalid plugin.json: JSON parsing failed" },
          { status: 400 }
        );
      }

      // Validate manifest structure
      const validation = validateManifest(parsedManifest);
      if (!validation.valid) {
        return NextResponse.json(
          { error: `Invalid plugin manifest: ${validation.error}` },
          { status: 400 }
        );
      }

      manifest = parsedManifest as PluginManifest;

      // Determine root directory
      if (manifestFile.name.includes("/")) {
        rootDir = manifestFile.name.split("/")[0] + "/";
      }
    } else {
      // If no plugin.json, try to infer from index.ts
      const indexFile =
        zip.file("index.ts") ||
        Object.values(zip.files).find((f) => f.name.endsWith("/index.ts"));

      if (!indexFile) {
        return NextResponse.json(
          {
            error:
              "Invalid plugin: Missing plugin.json or index.ts. Please provide a valid plugin package.",
          },
          { status: 400 }
        );
      }

      // Determine root directory
      if (indexFile.name.includes("/")) {
        rootDir = indexFile.name.split("/")[0] + "/";
      }

      // Create a basic manifest from the folder name
      const folderName = rootDir
        ? rootDir.replace("/", "")
        : file.name.replace(".zip", "");
      manifest = {
        id: folderName.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        name: folderName,
        version: "1.0.0",
        description: "Plugin installed from ZIP",
      };
    }

    if (!manifest || !manifest.id) {
      return NextResponse.json(
        { error: "Invalid plugin manifest: missing id" },
        { status: 400 }
      );
    }

    // Check if plugin already exists
    const existingPlugin = await db.query.plugins.findFirst({
      where: eq(schema.plugins.pluginId, manifest.id),
    });

    if (existingPlugin) {
      return NextResponse.json(
        {
          error: `Plugin "${manifest.name}" is already installed. Please uninstall it first to reinstall.`,
        },
        { status: 400 }
      );
    }

    // Create plugins directory if it doesn't exist
    if (!existsSync(PLUGINS_DIR)) {
      await mkdir(PLUGINS_DIR, { recursive: true });
    }

    // Create plugin directory
    const pluginDir = path.join(PLUGINS_DIR, manifest.id);

    if (existsSync(pluginDir)) {
      // Remove existing directory
      await rm(pluginDir, { recursive: true });
    }

    await mkdir(pluginDir, { recursive: true });

    // Extract files to plugin directory
    for (const [filePath, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue;

      // Remove root directory prefix if present
      let targetPath = filePath;
      if (rootDir && filePath.startsWith(rootDir)) {
        targetPath = filePath.slice(rootDir.length);
      }

      if (!targetPath) continue;

      // Security: Prevent path traversal attacks
      const fullPath = path.normalize(path.join(pluginDir, targetPath));

      // Verify the resolved path is still within plugin directory
      if (!fullPath.startsWith(pluginDir + path.sep) && fullPath !== pluginDir) {
        console.warn(`Path traversal attempt detected: ${filePath}`);
        continue; // Skip malicious files
      }

      const dirPath = path.dirname(fullPath);

      // Create directory if needed
      if (!existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true });
      }

      // Write file
      const content = await zipEntry.async("nodebuffer");
      await writeFile(fullPath, content);
    }

    // Write plugin.json if it doesn't exist
    const manifestPath = path.join(pluginDir, "plugin.json");
    if (!existsSync(manifestPath)) {
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    }

    // Register plugin in database
    const [installedPlugin] = await db
      .insert(schema.plugins)
      .values({
        pluginId: manifest.id,
        name: manifest.name,
        version: manifest.version,
        description: manifest.description || null,
        author: manifest.author || null,
        status: "active",
        path: pluginDir,
        menuItems: manifest.menuItems
          ? JSON.stringify(manifest.menuItems)
          : null,
        installedBy: session.user.id,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: `Plugin "${manifest.name}" installed successfully`,
      plugin: {
        id: installedPlugin.id,
        pluginId: installedPlugin.pluginId,
        name: installedPlugin.name,
        version: installedPlugin.version,
        status: installedPlugin.status,
      },
    });
  } catch (err) {
    console.error("Plugin installation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Installation failed" },
      { status: 500 }
    );
  }
}
