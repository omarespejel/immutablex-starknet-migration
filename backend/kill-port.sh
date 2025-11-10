#!/bin/bash
# Kill any process using port 3000

PORT=${1:-3000}

echo "Checking for processes on port $PORT..."

PIDS=$(lsof -ti:$PORT)

if [ -z "$PIDS" ]; then
    echo "✅ No processes found on port $PORT"
    exit 0
fi

echo "Found processes: $PIDS"
echo "Killing processes..."

for PID in $PIDS; do
    kill -9 $PID 2>/dev/null && echo "  ✅ Killed process $PID" || echo "  ⚠️  Failed to kill process $PID"
done

sleep 1

# Verify port is free
if lsof -ti:$PORT > /dev/null 2>&1; then
    echo "⚠️  Port $PORT may still be in use"
    exit 1
else
    echo "✅ Port $PORT is now free"
    exit 0
fi

