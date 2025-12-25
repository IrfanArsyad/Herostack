"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Share2, Copy, RefreshCw, Globe, Link as LinkIcon } from "lucide-react";
import { togglePublicShare, regenerateShareToken } from "@/lib/actions/share";

interface ShareDialogProps {
  pageId: string;
  pageName: string;
  initialIsPublic: boolean;
  initialShareToken: string | null;
}

export function ShareDialog({
  pageId,
  pageName,
  initialIsPublic,
  initialShareToken,
}: ShareDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [shareToken, setShareToken] = useState(initialShareToken);
  const [open, setOpen] = useState(false);

  const shareUrl =
    isPublic && shareToken
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${shareToken}`
      : null;

  const handleTogglePublic = () => {
    startTransition(async () => {
      const result = await togglePublicShare(pageId);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        setIsPublic(result.isPublic ?? false);
        setShareToken(result.shareToken ?? null);
        toast.success(
          result.isPublic ? "Page is now public" : "Page is now private"
        );
      }
    });
  };

  const handleRegenerateToken = () => {
    startTransition(async () => {
      const result = await regenerateShareToken(pageId);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        setShareToken(result.shareToken ?? null);
        toast.success("Share link regenerated");
      }
    });
  };

  const handleCopyLink = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard");
      } catch {
        toast.error("Failed to copy link");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Share Page
          </DialogTitle>
          <DialogDescription>
            Share &quot;{pageName}&quot; with anyone via a public link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Toggle public sharing */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="public-toggle" className="text-base">
                Public access
              </Label>
              <p className="text-sm text-muted-foreground">
                Anyone with the link can view this page
              </p>
            </div>
            <Switch
              id="public-toggle"
              checked={isPublic}
              onCheckedChange={handleTogglePublic}
              disabled={isPending}
            />
          </div>

          {/* Share link */}
          {isPublic && shareUrl && (
            <div className="space-y-3">
              <Label>Share link</Label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  title="Copy link"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerateToken}
                disabled={isPending}
                className="text-muted-foreground"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Generate new link
              </Button>
              <p className="text-xs text-muted-foreground">
                Generating a new link will invalidate the old one.
              </p>
            </div>
          )}

          {!isPublic && (
            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              <LinkIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Enable public access to get a shareable link</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
