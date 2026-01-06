import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { db } from "@/lib/db";
import { desc } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { PluginsManager } from "./plugins-manager";

export default async function AdminPluginsPage() {
  const session = await auth();

  if (!session?.user?.id || !isAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  const plugins = await db.query.plugins.findMany({
    orderBy: [desc(schema.plugins.installedAt)],
  });

  const formattedPlugins = plugins.map((p) => ({
    id: p.id,
    pluginId: p.pluginId,
    name: p.name,
    version: p.version,
    description: p.description,
    author: p.author,
    status: p.status,
    menuItems: p.menuItems ? JSON.parse(p.menuItems) : [],
    installedAt: p.installedAt,
  }));

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Plugin Management</h1>
        <p className="text-muted-foreground">
          Install and manage plugins from ZIP files
        </p>
      </div>

      <PluginsManager initialPlugins={formattedPlugins} />
    </div>
  );
}
