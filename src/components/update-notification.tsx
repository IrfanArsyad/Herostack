"use client";

import { useState, useEffect, useRef } from "react";
import { X, Download, ExternalLink, Terminal, ChevronDown, ChevronUp, Copy, Check, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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

interface UpdateStatus {
  status: string;
  progress: number;
  step: string;
  log: string;
  isComplete: boolean;
  isError: boolean;
  restartMethod: string | null;
}

export function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [updateLog, setUpdateLog] = useState("");
  const [updateComplete, setUpdateComplete] = useState(false);
  const [updateError, setUpdateError] = useState(false);
  const [restartMethod, setRestartMethod] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const dismissedVersion = localStorage.getItem("herostack_dismissed_update");

    async function checkUpdate() {
      try {
        const res = await fetch("/api/check-update");
        if (!res.ok) {
          setLoading(false);
          return;
        }

        const data: UpdateInfo = await res.json();

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

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const pollUpdateStatus = async () => {
    try {
      const res = await fetch("/api/update");
      if (!res.ok) return false;

      const data: UpdateStatus = await res.json();

      setProgress(data.progress);
      setCurrentStep(data.step);
      setUpdateLog(data.log);

      if (data.isError) {
        setUpdateError(true);
        setUpdating(false);
        return true; // Stop polling
      }

      if (data.isComplete) {
        setUpdateComplete(true);
        setRestartMethod(data.restartMethod);
        setUpdating(false);

        // Auto-dismiss notification after successful update
        // Save to localStorage so it won't show again after refresh
        const latestVer = localStorage.getItem("herostack_pending_update_version");
        if (latestVer) {
          localStorage.setItem("herostack_dismissed_update", latestVer);
        }

        return true; // Stop polling
      }

      return false; // Continue polling
    } catch {
      // Server might be restarting
      setCurrentStep("Server is restarting...");
      return false;
    }
  };

  const handleUpdate = async () => {
    if (!confirm("Update HeroStack ke versi terbaru?\n\nData Anda akan tetap aman. Server akan restart otomatis jika menggunakan PM2/systemd.")) {
      return;
    }

    // Save the version we're updating to
    if (updateInfo?.latestVersion) {
      localStorage.setItem("herostack_pending_update_version", updateInfo.latestVersion);
    }

    setUpdating(true);
    setProgress(0);
    setCurrentStep("Starting update...");
    setUpdateLog("");
    setUpdateComplete(false);
    setUpdateError(false);
    setRestartMethod(null);

    try {
      const res = await fetch("/api/update", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setUpdateError(true);
        setCurrentStep("Update failed: " + (data.error || "Unknown error"));
        setUpdating(false);
        return;
      }

      // Start polling every 2 seconds
      pollIntervalRef.current = setInterval(async () => {
        const done = await pollUpdateStatus();
        if (done && pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }, 2000);

    } catch (error) {
      setUpdateError(true);
      setCurrentStep(error instanceof Error ? error.message : "Update failed");
      setUpdating(false);
    }
  };

  const handleDismiss = () => {
    if (updateInfo?.latestVersion) {
      localStorage.setItem("herostack_dismissed_update", updateInfo.latestVersion);
    }
    setDismissed(true);
  };

  const updateCommand = `# Stop the server first, then run:
git pull origin main
bun install
bun run build
# Restart your server (PM2/systemd/docker)`;

  const dockerCommand = `docker compose pull
docker compose up -d --build`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !updateInfo?.updateAvailable || dismissed) {
    return null;
  }

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/20 rounded-full shrink-0">
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
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
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

        {/* Update in progress or complete */}
        {(updating || updateComplete || updateError) && (
          <div className="ml-11 space-y-3">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {updateError ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : updateComplete ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                  <span className={updateError ? "text-red-500" : ""}>{currentStep}</span>
                </div>
                <span className="text-muted-foreground text-xs">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Log output */}
            {updateLog && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Show log output
                </summary>
                <pre className="bg-muted/50 rounded-md p-3 mt-2 overflow-x-auto max-h-32 overflow-y-auto">
                  <code>{updateLog}</code>
                </pre>
              </details>
            )}

            {/* Complete message */}
            {updateComplete && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-md p-3 text-sm">
                {restartMethod === "pm2" && (
                  <p>Server telah di-restart via PM2. Refresh halaman untuk melihat versi terbaru.</p>
                )}
                {restartMethod === "systemd" && (
                  <p>Server telah di-restart via systemd. Refresh halaman untuk melihat versi terbaru.</p>
                )}
                {restartMethod === "docker" && (
                  <p>Update selesai. Untuk Docker, jalankan: <code className="bg-muted px-1 rounded">docker compose up -d --build</code></p>
                )}
                {restartMethod === "dev" && (
                  <p>Update selesai! Development server telah di-restart.</p>
                )}
                {restartMethod === "manual" && (
                  <p>Update selesai. Silakan restart server secara manual.</p>
                )}
                <Button size="sm" className="mt-2" onClick={() => {
                  // Mark this version as updated so notification won't show again
                  if (updateInfo?.latestVersion) {
                    localStorage.setItem("herostack_dismissed_update", updateInfo.latestVersion);
                  }
                  window.location.reload();
                }}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Refresh Halaman
                </Button>
              </div>
            )}

            {/* Error message */}
            {updateError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 text-sm">
                <p>Update gagal. Cek log di atas untuk detailnya.</p>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => {
                  setUpdateError(false);
                  setUpdating(false);
                  setProgress(0);
                  setCurrentStep("");
                }}>
                  Tutup
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        {!updating && !updateComplete && !updateError && (
          <div className="flex flex-wrap items-center gap-2 ml-11">
            <Button
              size="sm"
              variant="default"
              onClick={handleUpdate}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Update Now
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowInstructions(!showInstructions)}
            >
              <Terminal className="h-3.5 w-3.5 mr-1.5" />
              Manual
              {showInstructions ? (
                <ChevronUp className="h-3.5 w-3.5 ml-1.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
              )}
            </Button>
            {updateInfo.releaseUrl && (
              <Button size="sm" variant="ghost" asChild>
                <Link href={updateInfo.releaseUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Notes
                </Link>
              </Button>
            )}
          </div>
        )}

        {/* Update Instructions */}
        {showInstructions && !updating && !updateComplete && !updateError && (
          <div className="ml-11 space-y-3 mt-2">
            {/* Manual/PM2/Systemd */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Manual / PM2 / Systemd:</p>
              <div className="relative">
                <pre className="bg-muted/50 rounded-md p-3 text-xs overflow-x-auto">
                  <code>{updateCommand}</code>
                </pre>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => copyToClipboard(updateCommand)}
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>

            {/* Docker */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Docker:</p>
              <div className="relative">
                <pre className="bg-muted/50 rounded-md p-3 text-xs overflow-x-auto">
                  <code>{dockerCommand}</code>
                </pre>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => copyToClipboard(dockerCommand)}
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
