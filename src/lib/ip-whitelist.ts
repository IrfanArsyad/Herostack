import { headers } from "next/headers";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";

export interface IPWhitelistSettings {
  enabled: boolean;
  mode: "whitelist" | "blacklist";
  ips: string[];
  allowLocalhost: boolean;
  blockedMessage: string;
}

const DEFAULT_SETTINGS: IPWhitelistSettings = {
  enabled: false,
  mode: "whitelist",
  ips: [],
  allowLocalhost: true,
  blockedMessage: "Access denied. Your IP is not whitelisted.",
};

// Cache for settings (5 minute TTL)
let settingsCache: { settings: IPWhitelistSettings; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getIPWhitelistSettings(): Promise<IPWhitelistSettings> {
  // Check cache
  if (settingsCache && Date.now() - settingsCache.timestamp < CACHE_TTL) {
    return settingsCache.settings;
  }

  try {
    const plugin = await db.query.plugins.findFirst({
      where: eq(schema.plugins.pluginId, "ip-whitelist"),
    });

    if (!plugin || plugin.status !== "active") {
      return DEFAULT_SETTINGS;
    }

    const settings = plugin.settings
      ? JSON.parse(plugin.settings)
      : DEFAULT_SETTINGS;

    // Update cache
    settingsCache = { settings, timestamp: Date.now() };

    return settings;
  } catch (error) {
    console.error("Failed to load IP whitelist settings:", error);
    return DEFAULT_SETTINGS;
  }
}

export function clearIPWhitelistCache(): void {
  settingsCache = null;
}

export async function getClientIP(): Promise<string> {
  const headersList = await headers();

  // Check various headers for the real IP
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = headersList.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Cloudflare
  const cfConnectingIP = headersList.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return "127.0.0.1";
}

export function isLocalhost(ip: string): boolean {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "localhost" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.20.") ||
    ip.startsWith("172.21.") ||
    ip.startsWith("172.22.") ||
    ip.startsWith("172.23.") ||
    ip.startsWith("172.24.") ||
    ip.startsWith("172.25.") ||
    ip.startsWith("172.26.") ||
    ip.startsWith("172.27.") ||
    ip.startsWith("172.28.") ||
    ip.startsWith("172.29.") ||
    ip.startsWith("172.30.") ||
    ip.startsWith("172.31.")
  );
}

export function ipMatchesCIDR(ip: string, cidr: string): boolean {
  if (!cidr.includes("/")) {
    return ip === cidr;
  }

  const [range, bits] = cidr.split("/");
  const mask = parseInt(bits, 10);

  // Convert IPs to numbers for comparison
  const ipParts = ip.split(".").map(Number);
  const rangeParts = range.split(".").map(Number);

  if (ipParts.length !== 4 || rangeParts.length !== 4) {
    return false;
  }

  const ipNum =
    (ipParts[0] << 24) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3];
  const rangeNum =
    (rangeParts[0] << 24) +
    (rangeParts[1] << 16) +
    (rangeParts[2] << 8) +
    rangeParts[3];
  const maskNum = ~((1 << (32 - mask)) - 1);

  return (ipNum & maskNum) === (rangeNum & maskNum);
}

export function isIPInList(ip: string, ipList: string[]): boolean {
  return ipList.some((listIP) => ipMatchesCIDR(ip, listIP));
}

export interface IPCheckResult {
  allowed: boolean;
  ip: string;
  reason?: string;
  message?: string;
}

export async function checkIPAccess(): Promise<IPCheckResult> {
  const settings = await getIPWhitelistSettings();
  const clientIP = await getClientIP();

  // If protection is disabled, allow all
  if (!settings.enabled) {
    return { allowed: true, ip: clientIP, reason: "protection_disabled" };
  }

  // Check localhost
  if (settings.allowLocalhost && isLocalhost(clientIP)) {
    return { allowed: true, ip: clientIP, reason: "localhost_allowed" };
  }

  const inList = isIPInList(clientIP, settings.ips);

  if (settings.mode === "whitelist") {
    // Whitelist mode: only allow IPs in the list
    if (inList) {
      return { allowed: true, ip: clientIP, reason: "ip_whitelisted" };
    }
    return {
      allowed: false,
      ip: clientIP,
      reason: "ip_not_whitelisted",
      message: settings.blockedMessage,
    };
  } else {
    // Blacklist mode: block IPs in the list
    if (inList) {
      return {
        allowed: false,
        ip: clientIP,
        reason: "ip_blacklisted",
        message: settings.blockedMessage,
      };
    }
    return { allowed: true, ip: clientIP, reason: "ip_not_blacklisted" };
  }
}
