import type { Plugin, PluginMenuItem, PluginRegistry } from "./types";

class PluginRegistryImpl implements PluginRegistry {
  plugins: Map<string, Plugin> = new Map();
  menuItems: PluginMenuItem[] = [];

  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.config.id)) {
      console.warn(`Plugin ${plugin.config.id} is already registered`);
      return;
    }

    this.plugins.set(plugin.config.id, plugin);

    if (plugin.config.menuItems) {
      this.menuItems.push(...plugin.config.menuItems);
    }

    console.log(`Plugin registered: ${plugin.config.name} v${plugin.config.version}`);
  }

  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    if (plugin.config.menuItems) {
      this.menuItems = this.menuItems.filter(
        (item) => !plugin.config.menuItems?.some((pi) => pi.href === item.href)
      );
    }

    this.plugins.delete(pluginId);
  }

  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  getMenuItems(): PluginMenuItem[] {
    return this.menuItems;
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
}

export const pluginRegistry = new PluginRegistryImpl();
