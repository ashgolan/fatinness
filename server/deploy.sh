#!/bin/bash
set -e

echo "🚀 Auto deploy started..."

cd /var/www/fateness-server/server

echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Installing dependencies..."
npm install --omit=dev

echo "🔁 Restarting PM2..."
pm2 restart fateness-server

echo "✅ Deploy finished successfully"
