"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import { Shield, Plus, X, Loader2, AlertTriangle } from "lucide-react";

interface IPWhitelistSettings {
  enabled: boolean;
  mode: "whitelist" | "blacklist";
  ips: string[];
  allowLocalhost: boolean;
  blockedMessage: string;
}

interface IPWhitelistManagerProps {
  initialSettings: IPWhitelistSettings;
}

export function IPWhitelistManager({ initialSettings }: IPWhitelistManagerProps) {
  const [settings, setSettings] = useState<IPWhitelistSettings>(initialSettings);
  const [newIp, setNewIp] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showEnableWarning, setShowEnableWarning] = useState(false);

  const validateIP = (ip: string): boolean => {
    // IPv4
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    // IPv6
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}(\/\d{1,3})?$/;
    // Simple IPv6
    const ipv6SimpleRegex = /^::1$/;

    return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ipv6SimpleRegex.test(ip);
  };

  const handleAddIP = useCallback(() => {
    const ip = newIp.trim();

    if (!ip) {
      toast.error("Please enter an IP address");
      return;
    }

    if (!validateIP(ip)) {
      toast.error("Invalid IP address format");
      return;
    }

    if (settings.ips.includes(ip)) {
      toast.error("IP address already in the list");
      return;
    }

    setSettings((prev) => ({
      ...prev,
      ips: [...prev.ips, ip],
    }));
    setNewIp("");
  }, [newIp, settings.ips]);

  const handleRemoveIP = useCallback((ip: string) => {
    setSettings((prev) => ({
      ...prev,
      ips: prev.ips.filter((i) => i !== ip),
    }));
  }, []);

  const handleToggleEnabled = useCallback((enabled: boolean) => {
    if (enabled && settings.ips.length === 0 && settings.mode === "whitelist") {
      setShowEnableWarning(true);
      return;
    }
    setSettings((prev) => ({ ...prev, enabled }));
  }, [settings.ips.length, settings.mode]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/plugins/ip-whitelist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings"
      );
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddIP();
      }
    },
    [handleAddIP]
  );

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Protection Status
          </CardTitle>
          <CardDescription>
            Enable or disable IP-based access control
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">
                {settings.enabled ? "Protection Active" : "Protection Disabled"}
              </p>
              <p className="text-sm text-muted-foreground">
                {settings.enabled
                  ? settings.mode === "whitelist"
                    ? "Only whitelisted IPs can access"
                    : "Blacklisted IPs are blocked"
                  : "All IPs can access your application"}
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={handleToggleEnabled}
            />
          </div>

          {settings.enabled && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <div className="flex gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  IP protection is active. Make sure your IP is in the{" "}
                  {settings.mode} or you may lose access.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Settings</CardTitle>
          <CardDescription>Configure IP filtering behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select
                value={settings.mode}
                onValueChange={(value: "whitelist" | "blacklist") =>
                  setSettings((prev) => ({ ...prev, mode: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whitelist">
                    Whitelist (Allow only listed IPs)
                  </SelectItem>
                  <SelectItem value="blacklist">
                    Blacklist (Block listed IPs)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Allow Localhost</Label>
              <div className="flex items-center gap-2 h-10">
                <Switch
                  checked={settings.allowLocalhost}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, allowLocalhost: checked }))
                  }
                />
                <span className="text-sm text-muted-foreground">
                  Allow 127.0.0.1 and ::1
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Blocked Message</Label>
            <Textarea
              value={settings.blockedMessage}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  blockedMessage: e.target.value,
                }))
              }
              placeholder="Message shown to blocked users"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* IP List Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {settings.mode === "whitelist" ? "Whitelisted IPs" : "Blacklisted IPs"}
          </CardTitle>
          <CardDescription>
            {settings.mode === "whitelist"
              ? "Only these IP addresses will be allowed to access"
              : "These IP addresses will be blocked from accessing"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter IP address (e.g., 192.168.1.1 or 10.0.0.0/24)"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button onClick={handleAddIP}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {settings.ips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No IP addresses added yet</p>
              <p className="text-sm">Add IP addresses to the {settings.mode}</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {settings.ips.map((ip) => (
                <Badge
                  key={ip}
                  variant="secondary"
                  className="px-3 py-1.5 text-sm"
                >
                  {ip}
                  <button
                    onClick={() => handleRemoveIP(ip)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Supports IPv4, IPv6, and CIDR notation (e.g., 192.168.1.0/24)
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      </div>

      {/* Enable Warning Dialog */}
      <AlertDialog open={showEnableWarning} onOpenChange={setShowEnableWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable IP Whitelist?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to enable IP whitelist mode with an empty IP list.
              This will block ALL access to your application except localhost.
              <br /><br />
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setSettings((prev) => ({ ...prev, enabled: true }));
                setShowEnableWarning(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Enable Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
