#!/bin/bash
pkill -f "node server.js" 2>/dev/null
sleep 1
cd "$(dirname "$0")/server"
node server.js
