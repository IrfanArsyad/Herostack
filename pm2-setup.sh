#!/bin/bash

echo "🚀 Setting up PM2 for HeroStack..."

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null
then
    echo "📦 Installing PM2 globally..."
    npm install -g pm2
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Start PM2
echo "▶️  Starting application with PM2..."
npm run pm2:start

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Setup PM2 startup script
echo "🔄 Setting up PM2 startup script..."
pm2 startup

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Useful commands:"
echo "  npm run pm2:logs     - View logs"
echo "  npm run pm2:monit    - Monitor application"
echo "  npm run pm2:restart  - Restart application"
echo "  npm run pm2:stop     - Stop application"
echo "  pm2 list             - List all PM2 processes"
echo ""
