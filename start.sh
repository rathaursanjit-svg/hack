#!/usr/bin/env bash
set -e

# Change to script directory
cd "$(dirname "$0")"

echo "==================================================="
echo "    Smart Retail India - Development Server"
echo "==================================================="
echo ""

# Check dependencies
if [ ! -d "node_modules" ] || [ ! -d "server/node_modules" ] || [ ! -d "client/node_modules" ]; then
    echo "[INFO] Dependencies missing. Installing all workspaces and seeding database..."
    npm run setup
else
    if [ ! -f "server/data/retail.db" ]; then
        echo "[INFO] Database not found. Seeding initial database..."
        npm run seed
    fi
fi

echo ""
echo "[INFO] Starting Backend (Port 5000) and Frontend (Port 5173)..."
echo "[INFO] Open in your browser: http://localhost:5173"
echo "[INFO] Backend API:          http://localhost:5000"
echo ""

npm run dev
