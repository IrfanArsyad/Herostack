"use client";

import { useState, useEffect } from "react";
import { X, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  releaseUrl?: string;
  releaseName?: string;
  releaseDate?: string;
  releaseNotes?: string;
}

export function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user dismissed this version
    const dismissedVersion = localStorage.getItem("herostack_dismissed_update");

    async function checkUpdate() {
      try {
        const res = await fetch("/api/check-update");
        if (!res.ok) {
          setLoading(false);
          return;
        }

        const data: UpdateInfo = await res.json();

        // Don't show if already dismissed this version
        if (dismissedVersion === data.latestVersion) {
          setDismissed(true);
        }

        setUpdateInfo(data);
      } catch (error) {
        console.error("Failed to check for updates:", error);
      } finally {
        setLoading(false);
      }
    }

    checkUpdate();
  }, []);

  const handleDismiss = () => {
    if (updateInfo?.latestVersion) {
      localStorage.setItem("herostack_dismissed_update", updateInfo.latestVersion);
    }
    setDismissed(true);
  };

  // Don't render anything if loading, no update, or dismissed
  if (loading || !updateInfo?.updateAvailable || dismissed) {
    return null;
  }

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/20 rounded-full">
            <Download className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-sm">
              Update Available: v{updateInfo.latestVersion}
            </p>
            <p className="text-xs text-muted-foreground">
              You are running v{updateInfo.currentVersion}
              {updateInfo.releaseDate && (
                <> · Released {new Date(updateInfo.releaseDate).toLocaleDateString()}</>
              )}
            </p>
            {updateInfo.releaseNotes && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {updateInfo.releaseNotes}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {updateInfo.releaseUrl && (
            <Button size="sm" asChild>
              <Link href={updateInfo.releaseUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                View Release
              </Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleDismiss}
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
