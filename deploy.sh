#!/bin/bash
set -e

echo "📂 cd to project"
cd /var/www/fatinness

echo "📥 git fetch"
git fetch origin

echo "🔁 git reset --hard origin/main"
git reset --hard origin/main

echo "📦 install deps"
cd server
npm install --production
cd ..

echo "♻️ restart pm2"
pm2 restart fateness

echo "✅ deploy finished"
