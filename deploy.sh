#!/bin/bash
set -e

echo "📂 cd to project"
cd /var/www/fatinness

echo "📥 git fetch"
git fetch origin

echo "🔁 git reset --hard origin/main"
git reset --hard origin/main

# ======================
# 🟣 CLIENT BUILD
# ======================
echo "📦 install client deps"
cd client
npm install

echo "🔢 updating version"
echo "{ \"version\": \"$(date +%s)\" }" > /var/www/fatinness/client/public/version.json

echo "🏗 build client"
npm run build

cd ..

# ======================
# 🟢 SERVER
# ======================
echo "📦 install server deps"
cd server
npm install --production
cd ..

echo "♻️ restart pm2"
pm2 restart fatinness

echo "🔄 reload nginx"
sudo systemctl reload nginx

echo "✅ deploy finished"
