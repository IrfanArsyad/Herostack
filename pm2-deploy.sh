#!/bin/bash

echo "🚀 Deploying HeroStack..."

# Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull

# Install dependencies
echo "📦 Installing/updating dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Reload PM2 (zero-downtime restart)
echo "🔄 Reloading application with PM2..."
npm run pm2:reload

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Application status:"
pm2 list

echo ""
echo "📝 View logs with: npm run pm2:logs"
echo ""
