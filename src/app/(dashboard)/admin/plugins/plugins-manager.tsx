"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Upload,
  Package,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface PluginMenuItem {
  title: string;
  href: string;
  icon?: string;
}

interface Plugin {
  id: string;
  pluginId: string;
  name: string;
  version: string;
  description: string | null;
  author: string | null;
  status: "active" | "inactive" | "error";
  menuItems: PluginMenuItem[];
  installedAt: Date;
}

interface PluginsManagerProps {
  initialPlugins: Plugin[];
}

export function PluginsManager({ initialPlugins }: PluginsManagerProps) {
  const router = useRouter();
  const [plugins, setPlugins] = useState<Plugin[]>(initialPlugins);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pluginToDelete, setPluginToDelete] = useState<Plugin | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingPlugin, setTogglingPlugin] = useState<string | null>(null);

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".zip")) {
        toast.error("Please upload a ZIP file");
        return;
      }

      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/plugins/install", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to install plugin");
        }

        toast.success(data.message);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to install plugin"
        );
      } finally {
        setIsUploading(false);
      }
    },
    [router]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
      e.target.value = "";
    },
    [handleFileUpload]
  );

  const handleTogglePlugin = useCallback(
    async (plugin: Plugin) => {
      const newStatus = plugin.status === "active" ? "inactive" : "active";
      setTogglingPlugin(plugin.pluginId);

      try {
        const response = await fetch(`/api/plugins/${plugin.pluginId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to update plugin");
        }

        setPlugins((prev) =>
          prev.map((p) =>
            p.pluginId === plugin.pluginId ? { ...p, status: newStatus } : p
          )
        );
        toast.success(data.message);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update plugin"
        );
      } finally {
        setTogglingPlugin(null);
      }
    },
    []
  );

  const handleDeletePlugin = useCallback(async () => {
    if (!pluginToDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/plugins/${pluginToDelete.pluginId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to uninstall plugin");
      }

      setPlugins((prev) =>
        prev.filter((p) => p.pluginId !== pluginToDelete.pluginId)
      );
      toast.success(data.message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to uninstall plugin"
      );
    } finally {
      setIsDeleting(false);
      setPluginToDelete(null);
    }
  }, [pluginToDelete]);

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Install Plugin</CardTitle>
          <CardDescription>
            Upload a plugin ZIP file to install. The plugin should contain a
            plugin.json manifest or an index.ts file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              type="file"
              accept=".zip"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <div className="flex flex-col items-center gap-2">
              {isUploading ? (
                <>
                  <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    Installing plugin...
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Drop your plugin ZIP file here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    or click to browse
                  </p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installed Plugins */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Installed Plugins</CardTitle>
          <CardDescription>
            Manage your installed plugins. Toggle to enable/disable or uninstall
            completely.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plugins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No plugins installed yet</p>
              <p className="text-sm">
                Upload a plugin ZIP file to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {plugins.map((plugin) => (
                <div
                  key={plugin.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-md">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{plugin.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          v{plugin.version}
                        </Badge>
                        {plugin.status === "active" ? (
                          <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : plugin.status === "error" ? (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Error
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      {plugin.description && (
                        <p className="text-sm text-muted-foreground">
                          {plugin.description}
                        </p>
                      )}
                      {plugin.author && (
                        <p className="text-xs text-muted-foreground">
                          by {plugin.author}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {plugin.status === "active" ? "Enabled" : "Disabled"}
                      </span>
                      <Switch
                        checked={plugin.status === "active"}
                        disabled={
                          togglingPlugin === plugin.pluginId ||
                          plugin.status === "error"
                        }
                        onCheckedChange={() => handleTogglePlugin(plugin)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setPluginToDelete(plugin)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!pluginToDelete}
        onOpenChange={() => setPluginToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Uninstall Plugin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to uninstall &quot;{pluginToDelete?.name}
              &quot;? This will remove all plugin files and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlugin}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uninstalling...
                </>
              ) : (
                "Uninstall"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
