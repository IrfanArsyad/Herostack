"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BookOpen,
  Library,
  BookMarked,
  FileText,
  Search,
  LogOut,
  ChevronUp,
  Plus,
  FileSearch,
  Users,
  Shield,
  Tags,
} from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

interface AppSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

const navItems = [
  { title: "Shelves", href: "/shelves", icon: Library },
  { title: "Books", href: "/books", icon: BookMarked },
  { title: "Pages", href: "/pages", icon: FileText },
  { title: "Tags", href: "/tags", icon: Tags },
];

const pluginItems = [
  { title: "Summarize Docs", href: "/summarizer", icon: FileSearch },
];

const adminItems = [
  { title: "User Management", href: "/admin/users", icon: Users },
];

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="p-1.5 bg-primary rounded-md">
            <BookOpen className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold">HeroStack</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Search shortcut */}
        <div className="px-2 mb-2">
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground text-sm h-9"
            asChild
          >
            <Link href="/search">
              <Search className="mr-2 h-4 w-4" />
              Search...
              <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                ⌘K
              </kbd>
            </Link>
          </Button>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    className="h-9"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Plugins */}
        <SidebarGroup>
          <div className="px-2 py-1.5">
            <span className="text-xs font-medium text-muted-foreground">Plugins</span>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {pluginItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    className="h-9"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin (only for admin users) */}
        {user.role === "admin" && (
          <SidebarGroup>
            <div className="px-2 py-1.5">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Admin
              </span>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.href)}
                      className="h-9"
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="h-auto py-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.image ?? undefined} />
                      <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm truncate">{user.name}</span>
                    <ChevronUp className="ml-auto h-4 w-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    {user.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form action={logout} className="w-full">
                      <button type="submit" className="flex w-full items-center text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton className="h-auto py-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm truncate">{user.name}</span>
                <ChevronUp className="ml-auto h-4 w-4" />
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
