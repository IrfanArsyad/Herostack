<p align="center">
  <img src="https://raw.githubusercontent.com/IrfanArsyad/Herostack/main/public/logo.svg" width="80" height="80" alt="HeroStack Logo">
</p>

<h1 align="center">HeroStack</h1>

<p align="center">
  Self-hosted documentation platform built with Next.js 15.<br>
  Organize knowledge into Shelves, Books, Chapters, and Pages.
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

### Collaboration
- **Comments System** - Threaded comments on pages
- **Public Sharing** - Generate read-only links for external sharing
- **Role-Based Access Control (RBAC)**
  - **Admin** - Full access + user management
  - **Editor** - Create, edit, view content
  - **Viewer** - Read-only access

### Export
- **PDF Export** - Export pages, chapters, or entire books
- **Markdown Export** - Download content as Markdown files

### Authentication
- Email/Password login
- Google OAuth
- GitHub OAuth

## Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Auth.js v5
- **UI**: shadcn/ui + Tailwind CSS
- **Editor**: TipTap
- **Runtime**: Bun

## Quick Start

### Docker Compose

```bash
# Clone repository
git clone https://github.com/your-username/herostack.git
cd herostack

# Setup environment
cp .env.example .env

# Generate AUTH_SECRET and update .env
openssl rand -base64 32

# Run containers
docker compose up -d

# Run database migration (first time only)
docker compose exec app bun run db:push

# Open http://localhost:3056
```

### Local Development

```bash
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

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Random string for session encryption |
| `AUTH_URL` | Yes | Your app URL |
| `AUTH_GOOGLE_ID` | No | Google OAuth Client ID |
| `AUTH_GOOGLE_SECRET` | No | Google OAuth Secret |
| `AUTH_GITHUB_ID` | No | GitHub OAuth Client ID |
| `AUTH_GITHUB_SECRET` | No | GitHub OAuth Secret |

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

## Commands

```bash
# Development
bun run dev

# Build
bun run build

# Production
bun run start

# Database
bun run db:push       # Push schema to database
bun run db:generate   # Generate migrations
bun run db:studio     # Open Drizzle Studio
bun run db:seed       # Seed sample content (tutorial)
```

## License

MIT
