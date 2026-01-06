import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { CommandMenu } from "@/components/command-menu";
import { BookOpen, ShieldX } from "lucide-react";
import Link from "next/link";
import { checkIPAccess } from "@/lib/ip-whitelist";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";

async function getInstalledPlugins() {
  try {
    const plugins = await db.query.plugins.findMany({
      where: eq(schema.plugins.status, "active"),
    });

    const menuItems: { title: string; href: string }[] = [];

    for (const plugin of plugins) {
      if (plugin.menuItems) {
        try {
          const items = JSON.parse(plugin.menuItems) as Array<{
            title: string;
            href: string;
          }>;
          menuItems.push(...items);
        } catch {
          // Skip invalid menu items
        }
      }
    }

    return menuItems;
  } catch {
    return [];
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check IP whitelist
  const ipCheck = await checkIPAccess();

  if (!ipCheck.allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-8">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            {ipCheck.message || "Your IP address is not allowed to access this application."}
          </p>
          <p className="text-xs text-muted-foreground">
            Your IP: {ipCheck.ip}
          </p>
        </div>
      </div>
    );
  }

  // Get installed plugin menu items
  const pluginItems = await getInstalledPlugins();

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} pluginItems={pluginItems} />
      <SidebarInset>
        {/* Mobile header */}
        <header className="flex md:hidden items-center justify-between p-4 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="p-1.5 bg-primary rounded-md">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">HeroStack</span>
          </Link>
          <SidebarTrigger />
        </header>
        <main className="flex-1">{children}</main>
      </SidebarInset>
      <CommandMenu />
      <Toaster />
    </SidebarProvider>
  );
}
