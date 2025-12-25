import { pluginRegistry } from "./registry";
import type { Plugin } from "./types";

let initialized = false;

export async function loadPlugins(): Promise<void> {
  if (initialized) return;

  try {
    // Dynamic import of doc-summarizer plugin if it exists
    const docSummarizer = await import("../../../plugins/doc-summarizer").catch(
      () => null
    );

    if (docSummarizer?.default) {
      pluginRegistry.register(docSummarizer.default as Plugin);
    }
  } catch (error) {
    // Plugins folder may not exist, which is fine
    console.log("No plugins found or error loading plugins:", error);
  }

  initialized = true;
}

export function getPluginMenuItems() {
  return pluginRegistry.getMenuItems();
}

export function isPluginLoaded(pluginId: string): boolean {
  return pluginRegistry.getPlugin(pluginId) !== undefined;
}
