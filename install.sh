#!/bin/bash

# ===========================================
# HeroStack Installation Script
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print banner
print_banner() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════╗"
    echo "║           HeroStack Installer             ║"
    echo "║     Documentation Platform Setup          ║"
    echo "╚═══════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Function to print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ===========================================
# Installation Method Selection
# ===========================================
select_install_method() {
    echo ""
    echo -e "${CYAN}Select installation method:${NC}"
    echo ""
    echo "  1) Docker (Recommended) - Includes PostgreSQL"
    echo "  2) Manual - Requires existing PostgreSQL"
    echo ""
    read -p "Enter choice [1-2]: " INSTALL_METHOD

    case $INSTALL_METHOD in
        1) install_docker ;;
        2) install_manual ;;
        *)
            print_error "Invalid choice"
            select_install_method
            ;;
    esac
}

# ===========================================
# Docker Installation
# ===========================================
install_docker() {
    echo ""
    echo -e "${BLUE}Docker Installation${NC}"
    echo ""

    # Check Docker
    if ! command_exists docker; then
        print_error "Docker is not installed"
        echo ""
        echo "Please install Docker first:"
        echo "  https://docs.docker.com/get-docker/"
        echo ""
        exit 1
    fi
    print_status "Docker found"

    # Check Docker Compose
    if command_exists docker-compose; then
        print_status "Docker Compose found"
        COMPOSE_CMD="docker-compose"
    elif docker compose version >/dev/null 2>&1; then
        print_status "Docker Compose (plugin) found"
        COMPOSE_CMD="docker compose"
    else
        print_error "Docker Compose is not installed"
        exit 1
    fi

    # Setup .env
    setup_env_docker

    # Start services
    echo ""
    echo -e "${BLUE}Starting Docker containers...${NC}"
    echo ""

    $COMPOSE_CMD up -d --build

    print_status "Docker containers started"

    # Wait for services
    echo ""
    print_info "Waiting for services to be ready..."
    sleep 10

    # Show status
    $COMPOSE_CMD ps

    print_complete_docker
}

setup_env_docker() {
    echo ""
    echo -e "${BLUE}Setting up environment...${NC}"
    echo ""

    if [ -f .env ]; then
        print_warning ".env file already exists"
        read -p "Do you want to reconfigure? (y/N): " RECONFIGURE
        if [[ ! "$RECONFIGURE" =~ ^[Yy]$ ]]; then
            print_info "Keeping existing .env configuration"
            return
        fi
    fi

    # Copy .env.example
    cp .env.example .env
    print_status "Created .env from .env.example"

    # Generate AUTH_SECRET
    AUTH_SECRET=$(openssl rand -base64 32)
    sed_replace "AUTH_SECRET" "$AUTH_SECRET"
    print_status "AUTH_SECRET generated"

    # Generate random database password for Docker
    DB_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 20)
    DATABASE_URL="postgres://herostack:${DB_PASSWORD}@postgres:5432/herostack"
    sed_replace "DATABASE_URL" "$DATABASE_URL"

    # Update docker-compose.yml with the new password
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${DB_PASSWORD}|" docker-compose.yml
    else
        sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${DB_PASSWORD}|" docker-compose.yml
    fi
    print_status "Database URL configured with secure password"

    # App URL
    echo ""
    read -p "App URL [http://localhost:3056]: " AUTH_URL
    AUTH_URL=${AUTH_URL:-http://localhost:3056}
    sed_replace "AUTH_URL" "$AUTH_URL"
    print_status "App URL: $AUTH_URL"

    # OAuth (optional)
    echo ""
    echo -e "${YELLOW}OAuth Configuration (optional - press Enter to skip)${NC}"
    echo ""

    read -p "Google Client ID: " GOOGLE_ID
    if [ -n "$GOOGLE_ID" ]; then
        sed_replace "AUTH_GOOGLE_ID" "$GOOGLE_ID"
        read -p "Google Client Secret: " GOOGLE_SECRET
        sed_replace "AUTH_GOOGLE_SECRET" "$GOOGLE_SECRET"
        print_status "Google OAuth configured"
    fi

    read -p "GitHub Client ID: " GITHUB_ID
    if [ -n "$GITHUB_ID" ]; then
        sed_replace "AUTH_GITHUB_ID" "$GITHUB_ID"
        read -p "GitHub Client Secret: " GITHUB_SECRET
        sed_replace "AUTH_GITHUB_SECRET" "$GITHUB_SECRET"
        print_status "GitHub OAuth configured"
    fi
}

print_complete_docker() {
    echo ""
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════╗"
    echo "║     Installation Complete!                ║"
    echo "╚═══════════════════════════════════════════╝"
    echo -e "${NC}"

    echo ""
    echo "HeroStack is now running at: ${AUTH_URL:-http://localhost:3056}"
    echo ""
    echo -e "${BLUE}Useful commands:${NC}"
    echo ""
    echo "  View logs:      $COMPOSE_CMD logs -f"
    echo "  Stop:           $COMPOSE_CMD down"
    echo "  Restart:        $COMPOSE_CMD restart"
    echo "  Update:         git pull && $COMPOSE_CMD up -d --build"
    echo ""
    echo -e "${YELLOW}First user registered will be admin!${NC}"
    echo ""
}

# ===========================================
# Manual Installation (without Docker)
# ===========================================
install_manual() {
    echo ""
    echo -e "${BLUE}Manual Installation${NC}"
    echo ""

    # Check Bun
    if ! command_exists bun; then
        print_error "Bun is not installed"
        echo ""
        echo "Please install Bun first:"
        echo "  curl -fsSL https://bun.sh/install | bash"
        echo ""
        exit 1
    fi
    BUN_VERSION=$(bun --version)
    print_status "Bun found: v$BUN_VERSION"

    # Check PostgreSQL
    if command_exists psql; then
        PSQL_VERSION=$(psql --version | head -1)
        print_status "PostgreSQL found: $PSQL_VERSION"
    else
        print_warning "PostgreSQL client (psql) not found"
        print_info "Make sure PostgreSQL is installed and accessible"
    fi

    # Setup .env
    setup_env_manual

    # Install dependencies
    echo ""
    echo -e "${BLUE}Installing dependencies...${NC}"
    echo ""
    bun install
    print_status "Dependencies installed"

    # Database setup
    echo ""
    echo -e "${BLUE}Setting up database...${NC}"
    echo ""

    # Load .env
    set -a
    source .env
    set +a

    print_info "Running database migrations..."
    if bun run db:push; then
        print_status "Database migrations completed"
    else
        print_error "Database migration failed"
        echo ""
        echo "Please ensure:"
        echo "  1. PostgreSQL is running"
        echo "  2. Database exists and user has permissions"
        echo ""
        echo "To create database manually:"
        echo "  sudo -u postgres createdb herostack"
        echo "  sudo -u postgres createuser herostack"
        echo "  sudo -u postgres psql -c \"ALTER USER herostack WITH PASSWORD 'yourpassword';\""
        echo "  sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE herostack TO herostack;\""
        echo ""
        exit 1
    fi

    # Build
    echo ""
    echo -e "${BLUE}Building application...${NC}"
    echo ""

    if bun run build; then
        print_status "Application built successfully"
    else
        print_error "Build failed"
        exit 1
    fi

    print_complete_manual
}

setup_env_manual() {
    echo ""
    echo -e "${BLUE}Setting up environment...${NC}"
    echo ""

    if [ -f .env ]; then
        print_warning ".env file already exists"
        read -p "Do you want to reconfigure? (y/N): " RECONFIGURE
        if [[ ! "$RECONFIGURE" =~ ^[Yy]$ ]]; then
            print_info "Keeping existing .env configuration"
            return
        fi
    fi

    # Copy .env.example
    cp .env.example .env
    print_status "Created .env from .env.example"

    # Database configuration
    echo ""
    echo -e "${CYAN}Database Configuration${NC}"
    echo ""

    read -p "PostgreSQL Host [localhost]: " DB_HOST
    DB_HOST=${DB_HOST:-localhost}

    read -p "PostgreSQL Port [5432]: " DB_PORT
    DB_PORT=${DB_PORT:-5432}

    read -p "PostgreSQL Database [herostack]: " DB_NAME
    DB_NAME=${DB_NAME:-herostack}

    read -p "PostgreSQL User [herostack]: " DB_USER
    DB_USER=${DB_USER:-herostack}

    read -sp "PostgreSQL Password (required): " DB_PASS
    echo ""
    if [ -z "$DB_PASS" ]; then
        print_error "Password is required"
        exit 1
    fi

    DATABASE_URL="postgres://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME"
    sed_replace "DATABASE_URL" "$DATABASE_URL"
    print_status "Database URL configured"

    # Generate AUTH_SECRET
    AUTH_SECRET=$(openssl rand -base64 32)
    sed_replace "AUTH_SECRET" "$AUTH_SECRET"
    print_status "AUTH_SECRET generated"

    # App URL
    echo ""
    read -p "App URL [http://localhost:3056]: " AUTH_URL
    AUTH_URL=${AUTH_URL:-http://localhost:3056}
    sed_replace "AUTH_URL" "$AUTH_URL"
    print_status "App URL: $AUTH_URL"

    # OAuth (optional)
    echo ""
    echo -e "${YELLOW}OAuth Configuration (optional - press Enter to skip)${NC}"
    echo ""

    read -p "Google Client ID: " GOOGLE_ID
    if [ -n "$GOOGLE_ID" ]; then
        sed_replace "AUTH_GOOGLE_ID" "$GOOGLE_ID"
        read -p "Google Client Secret: " GOOGLE_SECRET
        sed_replace "AUTH_GOOGLE_SECRET" "$GOOGLE_SECRET"
        print_status "Google OAuth configured"
    fi

    read -p "GitHub Client ID: " GITHUB_ID
    if [ -n "$GITHUB_ID" ]; then
        sed_replace "AUTH_GITHUB_ID" "$GITHUB_ID"
        read -p "GitHub Client Secret: " GITHUB_SECRET
        sed_replace "AUTH_GITHUB_SECRET" "$GITHUB_SECRET"
        print_status "GitHub OAuth configured"
    fi
}

print_complete_manual() {
    echo ""
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════╗"
    echo "║     Installation Complete!                ║"
    echo "╚═══════════════════════════════════════════╝"
    echo -e "${NC}"

    echo ""
    echo "To start HeroStack:"
    echo ""
    echo -e "  ${BLUE}Development mode:${NC}"
    echo "    bun run dev"
    echo ""
    echo -e "  ${BLUE}Production mode:${NC}"
    echo "    bun run start"
    echo ""
    echo -e "  ${BLUE}With PM2:${NC}"
    echo "    pm2 start bun --name herostack -- run start"
    echo ""
    echo -e "  ${BLUE}With Systemd:${NC}"
    echo "    See README.md for systemd service setup"
    echo ""
    echo "Open your browser at: ${AUTH_URL:-http://localhost:3056}"
    echo ""
    echo -e "${YELLOW}First user registered will be admin!${NC}"
    echo ""
}

# ===========================================
# Utility Functions
# ===========================================
sed_replace() {
    local key=$1
    local value=$2
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^${key}=.*|${key}=\"${value}\"|" .env
    else
        sed -i "s|^${key}=.*|${key}=\"${value}\"|" .env
    fi
}

# ===========================================
# Main
# ===========================================
print_banner
select_install_method
