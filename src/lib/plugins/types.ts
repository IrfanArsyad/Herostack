import { ComponentType } from "react";

export interface PluginMenuItem {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

export interface PluginConfig {
  id: string;
  name: string;
  version: string;
  description: string;
  menuItems?: PluginMenuItem[];
}

export interface Plugin {
  config: PluginConfig;
  components?: Record<string, ComponentType<unknown>>;
  pages?: Record<string, ComponentType<unknown>>;
}

export interface PluginRegistry {
  plugins: Map<string, Plugin>;
  menuItems: PluginMenuItem[];
}
