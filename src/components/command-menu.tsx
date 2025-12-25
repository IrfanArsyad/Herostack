"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Library,
  BookMarked,
  FileText,
  FolderOpen,
  Search,
  Plus,
  Settings,
  LayoutDashboard,
  Tags,
} from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-lg max-w-lg">
        <VisuallyHidden>
          <DialogTitle>Command Menu</DialogTitle>
        </VisuallyHidden>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-4 [&_[cmdk-item]_svg]:w-4">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Type to search..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Quick Create">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/shelves?create=true"))}
                className="flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer aria-selected:bg-accent"
              >
                <Plus className="h-4 w-4" />
                <Library className="h-4 w-4" />
                <span>New Shelf</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/books?create=true"))}
                className="flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer aria-selected:bg-accent"
              >
                <Plus className="h-4 w-4" />
                <BookMarked className="h-4 w-4" />
                <span>New Book</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/pages?create=true"))}
                className="flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer aria-selected:bg-accent"
              >
                <Plus className="h-4 w-4" />
                <FileText className="h-4 w-4" />
                <span>New Page</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Navigation">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard"))}
                className="flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer aria-selected:bg-accent"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/shelves"))}
                className="flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer aria-selected:bg-accent"
              >
                <Library className="h-4 w-4" />
                <span>Shelves</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/books"))}
                className="flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer aria-selected:bg-accent"
              >
                <BookMarked className="h-4 w-4" />
                <span>Books</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/pages"))}
                className="flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer aria-selected:bg-accent"
              >
                <FileText className="h-4 w-4" />
                <span>Pages</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/search"))}
                className="flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer aria-selected:bg-accent"
              >
                <Search className="h-4 w-4" />
                <span>Search</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/tags"))}
                className="flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer aria-selected:bg-accent"
              >
                <Tags className="h-4 w-4" />
                <span>Tags</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              <span className="text-xs">⌘</span>K
            </kbd>
            {" "}to open
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
