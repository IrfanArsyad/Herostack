import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import packageJson from "../../../../package.json";

const GITHUB_REPO = "IrfanArsyad/Herostack";

interface GitHubRelease {
  tag_name: string;
  name: string;
  html_url: string;
  published_at: string;
  body: string;
}

export async function GET() {
  try {
    // Only allow authenticated admin users
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentVersion = packageJson.version;

    // Fetch latest release from GitHub
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "HeroStack-Update-Checker",
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      // No releases found or API error
      if (response.status === 404) {
        return NextResponse.json({
          currentVersion,
          latestVersion: currentVersion,
          updateAvailable: false,
          message: "No releases found",
        });
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const release: GitHubRelease = await response.json();
    const latestVersion = release.tag_name.replace(/^v/, ""); // Remove 'v' prefix if present

    // Compare versions
    const updateAvailable = isNewerVersion(latestVersion, currentVersion);

    return NextResponse.json({
      currentVersion,
      latestVersion,
      updateAvailable,
      releaseUrl: release.html_url,
      releaseName: release.name,
      releaseDate: release.published_at,
      releaseNotes: release.body?.slice(0, 500) || "", // Limit release notes length
    });
  } catch (error) {
    console.error("Update check error:", error);
    return NextResponse.json(
      { error: "Failed to check for updates" },
      { status: 500 }
    );
  }
}

// Simple version comparison (supports semver like 0.1.0, 1.0.0, etc.)
function isNewerVersion(latest: string, current: string): boolean {
  const latestParts = latest.split(".").map(Number);
  const currentParts = current.split(".").map(Number);

  for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
    const l = latestParts[i] || 0;
    const c = currentParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}
