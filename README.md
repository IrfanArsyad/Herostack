<p align="center">
  <img src="https://raw.githubusercontent.com/IrfanArsyad/Herostack/main/public/logo.svg" width="80" height="80" alt="HeroStack Logo">
</p>

<h1 align="center">HeroStack</h1>

<p align="center">
  Self-hosted documentation platform built with Next.js 15.<br>
  Organize knowledge into Shelves, Books, Chapters, and Pages.
</p>

<p align="center">
  <img src="./screenshot/Herostack.png" alt="HeroStack Preview" width="800">
</p>

<p align="center">
  <a href="./screenshot">View More Screenshots</a>
</p>

## Features

### Content Management
- **Hierarchical Organization** - Shelves → Books → Chapters → Pages
- **Rich Text Editor** - TipTap-based editor with formatting, code blocks, callouts
- **Drag & Drop Ordering** - Reorder pages and chapters easily
- **Revision History** - Track changes and restore previous versions
- **Tags System** - Organize content with tags across all entity types

### Reading Experience
- **Book Reader Modal** - Read entire books in a fullscreen modal with table of contents
- **Quick Actions** - Hover to reveal Read/Edit buttons on all content lists
- **Page Navigation** - Navigate between pages with prev/next buttons

### Search & Discovery
- **Full-Text Search** - PostgreSQL-powered search across all content
- **Pages Search** - Filter pages by name or book
- **Ranked Results** - Results sorted by relevance with snippets
- **Command Menu** - Quick navigation with Cmd+K

### Teams & Collaboration
- **Team Management** - Create teams and invite members
- **Team-based Content** - Assign shelves and books to teams
- **Invitation Links** - Generate shareable invite links with role assignment
- **Member Roles** - Owner, Admin, Member with different permissions
- **Comments System** - Threaded comments on pages
- **Public Sharing** - Generate read-only links for external sharing
- **Role-Based Access Control (RBAC)**
  - **Super Admin** - Full access to ALL data + cannot be edited/deleted
  - **Admin** - Full access + user management
  - **Editor** - Create, edit, view content
  - **Viewer** - Read-only access

### Import & Export
- **BookStack Import** - Import from BookStack Portable ZIP format
- **PDF Export** - Export pages, chapters, or entire books
- **Markdown Export** - Download content as Markdown files

### Plugin System
- **ZIP Installation** - Install plugins by uploading ZIP files
- **Plugin Management** - Enable, disable, or uninstall plugins from Admin panel
- **Dynamic Menu** - Installed plugins appear in sidebar automatically
- **Plugin Marketplace** - Extend functionality with third-party plugins

### Authentication & Security
- Email/Password login
- Google OAuth
- GitHub OAuth
- **Auto-Logout**: Automatic logout when session expires
- **Session Monitoring**: Real-time session validation
- **Session Warning**: 5-minute warning before expiration
- **Multi-Tab Sync**: Logout synced across all browser tabs
- **Configurable Timeout**: Customizable session duration (default: 24 hours)

## Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **Database**: PostgreSQL or SQLite + Drizzle ORM
- **Auth**: Auth.js v5
- **UI**: shadcn/ui + Tailwind CSS
- **Editor**: TipTap
- **Runtime**: Bun

## Installation Options

Choose the installation method that suits your needs:

### 🚀 For Quick Testing (Clone)
```bash
git clone https://github.com/IrfanArsyad/Herostack.git
cd Herostack
./install.sh
```

### 🍴 For Development/Contributing (Fork)
1. **Fork** this repository on GitHub (click "Fork" button)
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/Herostack.git
   cd Herostack
   ```
3. Add upstream remote (to sync with original):
   ```bash
   git remote add upstream https://github.com/IrfanArsyad/Herostack.git
   ```
4. Run installer:
   ```bash
   ./install.sh
   ```

### 🎯 For Your Own Project (Template)
1. Click "Use this template" button on GitHub (if available)
2. Create your new repository
3. Clone your new repository:
   ```bash
   git clone https://github.com/YOUR-USERNAME/your-project.git
   cd your-project
   ```
4. Run setup script to configure Git:
   ```bash
   ./setup-repo.sh
   ```

> **Note:** If you cloned this repository and want to push to your own repository, run `./setup-repo.sh` to change the remote URL. See [GIT-SETUP.md](./GIT-SETUP.md) for details.

## Quick Install

```bash
git clone https://github.com/IrfanArsyad/Herostack.git
cd Herostack
./install.sh
```

The installer will guide you through:
- **Docker mode** - Includes PostgreSQL, recommended for quick setup
- **Manual mode** - Requires existing PostgreSQL, for custom deployments

## Manual Setup

### Docker Compose

```bash
# Clone repository
git clone https://github.com/IrfanArsyad/Herostack.git
cd Herostack

# Setup environment
cp .env.example .env

# Generate AUTH_SECRET and update .env
openssl rand -base64 32

# Run containers
docker compose up -d

# Open http://localhost:3056
```

**Create default superadmin (first time only):**
```bash
docker compose exec app bun run db:superadmin
```

**Default Login:**
```
Email: superadmin@studiolab.id
Password: superadmin123
```

### Local Development (PostgreSQL)

```bash
# Install Bun (if not installed)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install

# Setup environment
cp .env.example .env
# Edit .env with your database URL

# Push database schema
bun run db:push

# Start dev server
bun run dev

# Open http://localhost:3056
```

### Local Development (SQLite)

SQLite is a simpler alternative that doesn't require a separate database server.

```bash
# Install Bun (if not installed)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install

# Setup environment
cp .env.example .env

# Edit .env to use SQLite
# DATABASE_TYPE="sqlite"
# DATABASE_PATH="./data/herostack.db"

# Create data directory
mkdir -p data

# Push database schema (SQLite)
bunx drizzle-kit push --config drizzle.config.sqlite.ts

# Start dev server
bun run dev

# Open http://localhost:3056
```

> **Note:** SQLite doesn't support full-text search. Search functionality will use basic LIKE queries instead.

### Production with PM2

#### Quick Setup (Recommended)

HeroStack includes ready-to-use PM2 configuration and setup scripts:

```bash
# One-time setup (installs PM2, builds app, and starts it)
./pm2-setup.sh
```

The setup script will:
- Create logs directory
- Install PM2 globally (if not already installed)
- Install dependencies
- Build the application
- Start the app with PM2
- Save PM2 configuration
- Setup auto-start on system reboot

#### NPM Scripts

```bash
npm run pm2:start    # Start application with PM2
npm run pm2:stop     # Stop application
npm run pm2:restart  # Restart application
npm run pm2:reload   # Zero-downtime reload
npm run pm2:delete   # Remove from PM2
npm run pm2:logs     # View logs
npm run pm2:monit    # Monitor application
```

#### Deployment Script

For automated deployments (pull latest code, build, and reload):

```bash
./pm2-deploy.sh
```

This script will:
- Pull latest changes from git
- Install/update dependencies
- Build the application
- Reload the app with zero downtime

#### Manual PM2 Setup

If you prefer manual setup:

```bash
# Setup environment
cp .env.example .env
# Edit .env with your database URL and AUTH_SECRET

# Install dependencies and build
npm install
npm run build

# Install PM2 globally
npm install -g pm2

# Start with PM2 using ecosystem.config.js
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Auto-start on reboot
pm2 startup
```

#### PM2 Configuration

The `ecosystem.config.js` file includes:
- Cluster mode for better performance
- Auto-restart on crashes
- Memory limit (1GB)
- Log management
- Environment variables

#### Monitoring

```bash
pm2 list            # List all processes
pm2 status          # Check status
pm2 logs herostack  # View live logs
pm2 monit           # Real-time monitoring dashboard
```

### Production with Systemd

Create `/etc/systemd/system/herostack.service`:

```ini
[Unit]
Description=HeroStack Documentation Platform
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/herostack
ExecStart=/usr/local/bin/bun run start
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl enable herostack
sudo systemctl start herostack

# Check status
sudo systemctl status herostack
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_TYPE` | No | Database type: `postgresql` (default) or `sqlite` |
| `DATABASE_URL` | Yes* | PostgreSQL connection string (*required for PostgreSQL) |
| `DATABASE_PATH` | No | SQLite file path (default: `./data/herostack.db`) |
| `AUTH_SECRET` | Yes | Random string for session encryption |
| `AUTH_URL` | Yes | Your app URL |
| `AUTH_GOOGLE_ID` | No | Google OAuth Client ID |
| `AUTH_GOOGLE_SECRET` | No | Google OAuth Secret |
| `AUTH_GITHUB_ID` | No | GitHub OAuth Client ID |
| `AUTH_GITHUB_SECRET` | No | GitHub OAuth Secret |
| `SESSION_TIMEOUT_HOURS` | No | Session timeout in hours (default: 24) |

## OAuth Setup

### GitHub OAuth

1. Go to https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in the form:
   - **Application name:** HeroStack
   - **Homepage URL:** `http://localhost:3056` (or your production URL)
   - **Authorization callback URL:** `http://localhost:3056/api/auth/callback/github`
4. Click **Register application**
5. Copy **Client ID** and generate **Client Secret**
6. Add to `.env`:
   ```
   AUTH_GITHUB_ID="your-client-id"
   AUTH_GITHUB_SECRET="your-client-secret"
   ```

### Google OAuth

1. Go to https://console.cloud.google.com/apis/credentials
2. Create a new project or select an existing one
3. Click **"Create Credentials"** → **"OAuth client ID"**
4. If prompted, configure the OAuth consent screen first
5. Select **Application type:** Web application
6. Fill in:
   - **Name:** HeroStack
   - **Authorized JavaScript origins:** `http://localhost:3056`
   - **Authorized redirect URIs:** `http://localhost:3056/api/auth/callback/google`
7. Click **Create**
8. Copy **Client ID** and **Client Secret**
9. Add to `.env`:
   ```
   AUTH_GOOGLE_ID="your-client-id"
   AUTH_GOOGLE_SECRET="your-client-secret"
   ```

> **Note:** For production, replace `http://localhost:3056` with your actual domain.

## Session Management

HeroStack includes automatic session management with auto-logout when sessions expire.

**Features:**
- Auto-logout when session expires
- Configurable session timeout (default: 24 hours)
- Warning notification 5 minutes before expiration
- Auto-refresh every 5 minutes for active users
- Multi-tab logout synchronization

**Configuration:**

```bash
# .env
SESSION_TIMEOUT_HOURS="24"  # Default: 24 hours
```

For more details, see [SESSION.md](./SESSION.md)

## Commands

```bash
# Development
bun run dev

# Build
bun run build

# Production
bun run start

# Database (PostgreSQL)
bun run db:push       # Push schema to database
bun run db:generate   # Generate migrations
bun run db:studio     # Open Drizzle Studio
bun run db:seed       # Seed sample content (tutorial)
bun run db:superadmin # Create default superadmin user

# Database (SQLite)
bunx drizzle-kit push --config drizzle.config.sqlite.ts
bunx drizzle-kit studio --config drizzle.config.sqlite.ts
```

## Plugins

### Installing Plugins

1. Download plugin ZIP file
2. Go to **Admin → Plugins**
3. Drag & drop or click to upload ZIP
4. Plugin will be installed and activated automatically

### Available Plugins

| Plugin | Description |
|--------|-------------|
| [IP Whitelist](https://github.com/IrfanArsyad/herostack-whitelist) | Restrict access by IP address |
| [Doc Summarizer](https://github.com/IrfanArsyad/herostack-doc-summarizer) | Summarize docs from URL using AI |

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on:
- Fork & clone workflow
- Development setup
- Branch naming conventions
- Pull request process

**Quick Start for Contributors:**
```bash
# Fork repository di GitHub, kemudian:
git clone https://github.com/YOUR-USERNAME/Herostack.git
cd Herostack
git remote add upstream https://github.com/IrfanArsyad/Herostack.git
```

See [GIT-SETUP.md](./GIT-SETUP.md) for Git workflow and [GIT-QUICKREF.md](./GIT-QUICKREF.md) for common commands.

## Documentation

- [SESSION.md](./SESSION.md) - Session management and auto-logout
- [PM2.md](./PM2.md) - PM2 deployment and monitoring (Bahasa)
- [GIT-SETUP.md](./GIT-SETUP.md) - Git repository setup guide
- [GIT-QUICKREF.md](./GIT-QUICKREF.md) - Git commands quick reference
- [CONTRIBUTING.md](./CONTRIBUTING.md) - How to contribute

## License

MIT
