# HeroStack

Self-hosted documentation platform built with Next.js 15. Organize knowledge into Shelves, Books, Chapters, and Pages with a clean, modern interface.

## Features

### Content Management
- **Hierarchical Organization** - Shelves → Books → Chapters → Pages
- **Rich Text Editor** - TipTap-based editor with formatting, code blocks, callouts
- **Drag & Drop Ordering** - Reorder pages and chapters easily
- **Revision History** - Track changes and restore previous versions
- **Tags System** - Organize content with tags across all entity types

### Search & Discovery
- **Full-Text Search** - PostgreSQL-powered search across all content
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

# Open http://localhost:3000
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

# Open http://localhost:3000
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
```

## License

MIT
