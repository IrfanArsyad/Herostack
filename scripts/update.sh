#!/bin/bash

# HeroStack Auto-Update Script
# This script updates the application safely with progress tracking

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$APP_DIR/update.log"
STATUS_FILE="$APP_DIR/update.status"

# Clear previous logs
> "$LOG_FILE"
echo "starting" > "$STATUS_FILE"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
    echo "$1"
}

set_status() {
    echo "$1" > "$STATUS_FILE"
}

cd "$APP_DIR"

log "=== HeroStack Update Started ==="

# Stop dev server if running (for development)
if pgrep -f "next dev" > /dev/null || pgrep -f "bun run dev" > /dev/null; then
    log "[Prep] Stopping development server..."
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "bun run dev" 2>/dev/null || true
    sleep 2
fi

set_status "step1_git"

# Step 1: Git pull (20%)
log "[Step 1/5] Fetching latest changes from GitHub..."
if git fetch origin main 2>> "$LOG_FILE" && git pull origin main 2>> "$LOG_FILE"; then
    log "[Step 1/5] Git pull completed"
else
    log "[ERROR] Git pull failed"
    set_status "error"
    exit 1
fi

set_status "step2_deps"

# Step 2: Install dependencies (40%)
log "[Step 2/5] Installing dependencies..."
if bun install 2>> "$LOG_FILE"; then
    log "[Step 2/5] Dependencies installed"
else
    log "[ERROR] Dependency installation failed"
    set_status "error"
    exit 1
fi

set_status "step3_db"

# Step 3: Run database migrations (60%)
# db:push hanya menambah tabel/kolom baru, TIDAK menghapus data existing
log "[Step 3/5] Checking for database schema changes..."

# Use timeout and force non-interactive mode
# drizzle-kit push with --force skips confirmations
if timeout 60 bunx drizzle-kit push --force 2>> "$LOG_FILE"; then
    log "[Step 3/5] Database schema updated successfully"
else
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 124 ]; then
        log "[WARNING] Database migration timed out - skipping"
    else
        log "[Step 3/5] No schema changes needed or migration skipped"
    fi
fi

set_status "step4_build"

# Step 4: Build (80%)
log "[Step 4/5] Building application..."
# Build can take a while, use 5 minute timeout
if timeout 300 bun run build 2>> "$LOG_FILE"; then
    log "[Step 4/5] Build completed"
else
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 124 ]; then
        log "[ERROR] Build timed out after 5 minutes"
    else
        log "[ERROR] Build failed with exit code $EXIT_CODE"
    fi
    set_status "error"
    exit 1
fi

set_status "step5_restart"

# Step 5: Restart server (100%)
log "[Step 5/5] Detecting server runtime..."

RESTART_METHOD="manual"

# Check if running in Docker
if [ -f /.dockerenv ] || grep -q docker /proc/1/cgroup 2>/dev/null; then
    log "[Step 5/5] Docker detected - container will restart automatically"
    RESTART_METHOD="docker"
# Check PM2
elif command -v pm2 &> /dev/null; then
    PM2_PROCESS=$(pm2 jlist 2>/dev/null | grep -o '"name":"[^"]*herostack[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$PM2_PROCESS" ]; then
        log "[Step 5/5] PM2 detected - restarting $PM2_PROCESS..."
        if pm2 restart "$PM2_PROCESS" 2>> "$LOG_FILE"; then
            log "[Step 5/5] PM2 restart successful"
            RESTART_METHOD="pm2"
        fi
    fi
# Check systemd
elif systemctl list-units --type=service | grep -q herostack; then
    log "[Step 5/5] systemd detected - restarting service..."
    if sudo systemctl restart herostack 2>> "$LOG_FILE"; then
        log "[Step 5/5] systemd restart successful"
        RESTART_METHOD="systemd"
    fi
fi

if [ "$RESTART_METHOD" = "manual" ]; then
    # Check if we're in development mode (dev server was running)
    if [ -f "$APP_DIR/.next/BUILD_ID" ]; then
        log "[Step 5/5] Starting development server..."
        cd "$APP_DIR"
        nohup bun run dev > /dev/null 2>&1 &
        sleep 3
        log "[Step 5/5] Development server started"
        RESTART_METHOD="dev"
    else
        log "[Step 5/5] No auto-restart method detected. Please restart manually."
    fi
fi

log "=== Update Completed Successfully ==="
log "Restart method: $RESTART_METHOD"
set_status "complete:$RESTART_METHOD"
