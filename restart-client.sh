#!/bin/bash
pkill -f "vite" 2>/dev/null
sleep 1
cd "$(dirname "$0")/smallworld-client"
npm run dev
