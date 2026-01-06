import { pluginRegistry } from "./registry";
import type { Plugin, PluginMenuItem } from "./types";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";

let initialized = false;

export async function loadPlugins(): Promise<void> {
  if (initialized) return;
  // Plugins are now loaded from database via getInstalledPluginMenuItems()
  initialized = true;
}

// Get menu items from database-installed plugins
export async function getInstalledPluginMenuItems(): Promise<PluginMenuItem[]> {
  try {
    const plugins = await db.query.plugins.findMany({
      where: eq(schema.plugins.status, "active"),
    });

    const menuItems: PluginMenuItem[] = [];

    for (const plugin of plugins) {
      if (plugin.menuItems) {
        try {
          const items = JSON.parse(plugin.menuItems) as Array<{
            title: string;
            href: string;
            icon?: string;
          }>;

          for (const item of items) {
            // Note: Icons from installed plugins will use a default icon
            // since we can't dynamically import React components from user plugins
            menuItems.push({
              title: item.title,
              href: item.href,
              icon: () => null, // Will use default icon in sidebar
            });
          }
        } catch {
          console.warn(`Failed to parse menu items for plugin ${plugin.pluginId}`);
        }
      }
    }

    return menuItems;
  } catch (error) {
    console.error("Failed to load installed plugin menu items:", error);
    return [];
  }
}

export function getPluginMenuItems() {
  return pluginRegistry.getMenuItems();
}

export function isPluginLoaded(pluginId: string): boolean {
  return pluginRegistry.getPlugin(pluginId) !== undefined;
}

// Check if a plugin is installed and active in the database
export async function isPluginActive(pluginId: string): Promise<boolean> {
  try {
    const plugin = await db.query.plugins.findFirst({
      where: eq(schema.plugins.pluginId, pluginId),
    });

    return plugin?.status === "active";
  } catch {
    return false;
  }
}
