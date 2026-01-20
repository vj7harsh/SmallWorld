#!/bin/bash

# Start SmallWorld - Server and Client

echo "Starting SmallWorld..."

# Start database
cd server
docker compose up -d 2>/dev/null || echo "Docker not available or already running"

# Start server in background
echo "Starting server..."
node server.js &
SERVER_PID=$!

# Wait for server to be ready
sleep 2

# Start client in background
echo "Starting client..."
cd ../smallworld-client
npm run dev &
CLIENT_PID=$!

echo ""
echo "================================"
echo "SmallWorld is running!"
echo "Open: http://localhost:5173"
echo "================================"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit" INT
wait
