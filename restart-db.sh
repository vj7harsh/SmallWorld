#!/bin/bash
cd "$(dirname "$0")/server"
docker compose down 2>/dev/null
docker compose up -d
echo "Database restarted on port 5433"
