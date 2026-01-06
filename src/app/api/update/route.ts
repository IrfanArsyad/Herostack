import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { spawn } from "child_process";
import path from "path";
import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";

const LOG_FILE = path.join(process.cwd(), "update.log");
const STATUS_FILE = path.join(process.cwd(), "update.status");

// Map status to progress percentage
const STATUS_PROGRESS: Record<string, number> = {
  starting: 0,
  step1_git: 10,
  step2_deps: 30,
  step3_db: 50,
  step4_build: 70,
  step5_restart: 90,
};

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(session.user.role)) {
    return NextResponse.json(
      { error: "Only administrators can update the application" },
      { status: 403 }
    );
  }

  try {
    // Clear previous status
    await writeFile(STATUS_FILE, "starting");
    await writeFile(LOG_FILE, "");

    const scriptPath = path.join(process.cwd(), "scripts", "update.sh");

    // Run update script in background
    const updateProcess = spawn("bash", [scriptPath], {
      detached: true,
      stdio: ["ignore", "ignore", "ignore"],
      cwd: process.cwd(),
    });

    updateProcess.unref();

    return NextResponse.json({
      success: true,
      message: "Update started",
    });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    let log = "";
    let status = "idle";
    let progress = 0;
    let restartMethod = "manual";

    // Read status file
    if (existsSync(STATUS_FILE)) {
      status = (await readFile(STATUS_FILE, "utf-8")).trim();
    }

    // Read log file
    if (existsSync(LOG_FILE)) {
      log = await readFile(LOG_FILE, "utf-8");
    }

    // Parse status
    const isError = status === "error";
    const isComplete = status.startsWith("complete:");

    if (isComplete) {
      progress = 100;
      restartMethod = status.split(":")[1] || "manual";
    } else if (isError) {
      progress = STATUS_PROGRESS[status] || 0;
    } else {
      progress = STATUS_PROGRESS[status] || 0;
    }

    // Get current step description
    const stepDescriptions: Record<string, string> = {
      starting: "Preparing update...",
      step1_git: "Downloading latest code from GitHub...",
      step2_deps: "Installing dependencies...",
      step3_db: "Running database migrations...",
      step4_build: "Building application...",
      step5_restart: "Restarting server...",
      error: "Update failed",
    };

    return NextResponse.json({
      status,
      progress,
      step: stepDescriptions[status] || (isComplete ? "Update complete!" : "Unknown"),
      log: log.split("\n").slice(-15).join("\n"), // Last 15 lines
      isComplete,
      isError,
      restartMethod: isComplete ? restartMethod : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read update status" },
      { status: 500 }
    );
  }
}
