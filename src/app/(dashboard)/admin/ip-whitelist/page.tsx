import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { IPWhitelistManager } from "./ip-whitelist-manager";

export default async function IPWhitelistPage() {
  const session = await auth();

  if (!session?.user?.id || !isAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  // Check if plugin is installed
  const plugin = await db.query.plugins.findFirst({
    where: eq(schema.plugins.pluginId, "ip-whitelist"),
  });

  if (!plugin) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">IP Whitelist</h1>
          <p className="text-muted-foreground">
            Restrict access by IP address
          </p>
        </div>
        <div className="border rounded-lg p-8 text-center">
          <p className="text-muted-foreground mb-4">
            IP Whitelist plugin is not installed.
          </p>
          <p className="text-sm text-muted-foreground">
            Please install the plugin from Admin → Plugins
          </p>
        </div>
      </div>
    );
  }

  const settings = plugin.settings
    ? JSON.parse(plugin.settings)
    : {
        enabled: false,
        mode: "whitelist",
        ips: [],
        allowLocalhost: true,
        blockedMessage: "Access denied. Your IP is not whitelisted.",
      };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">IP Whitelist</h1>
        <p className="text-muted-foreground">
          Restrict access to your application by IP address
        </p>
      </div>

      <IPWhitelistManager initialSettings={settings} />
    </div>
  );
}
