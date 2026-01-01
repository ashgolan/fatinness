#!/bin/bash
set -e

echo "🚀 Auto deploy started..."

cd /var/www/fatinness

echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Installing backend dependencies..."
cd server
npm install --omit=dev

echo "🔁 Restarting PM2..."
pm2 restart fateness

echo "✅ Deploy finished successfully"
