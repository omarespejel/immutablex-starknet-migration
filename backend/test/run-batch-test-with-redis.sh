#!/bin/bash
# Run batch test with Redis enabled backend

echo "═══════════════════════════════════════════════════════"
echo "  BATCH TEST WITH REDIS"
echo "═══════════════════════════════════════════════════════"
echo ""

# Check if Redis is running
if ! docker ps | grep -q redis; then
    echo "❌ Redis is not running!"
    echo "   Start it with: docker-compose up -d redis"
    exit 1
fi

echo "✅ Redis is running"
echo ""

# Check if backend is running
if ! curl -s http://localhost:3000/wallet/generate > /dev/null 2>&1; then
    echo "⚠️  Backend doesn't seem to be running"
    echo ""
    echo "Start backend WITH Redis enabled:"
    echo "  cd backend"
    echo "  bun run dev:redis"
    echo ""
    echo "Or manually:"
    echo "  cd backend"
    echo "  bun run --watch src/main.ts"
    echo ""
    echo "Then run this test again in another terminal."
    exit 1
fi

echo "✅ Backend is running"
echo ""

# Check if SKIP_REDIS is set
if curl -s http://localhost:3000/wallet/generate | grep -q "error"; then
    echo "⚠️  Backend might be running with SKIP_REDIS=true"
    echo "   Make sure you're using: bun run dev:redis"
    echo ""
fi

echo "📤 Running batch test..."
echo ""

cd "$(dirname "$0")/.."
bun run test/batch-test.ts

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  CHECK BACKEND LOGS FOR:"
echo "═══════════════════════════════════════════════════════"
echo "  [BATCH] Submitting batch of 100 actions"
echo "  [BATCH] Processing 100 actions for user ..."
echo "  Batch sponsored: 0x... (transaction hash)"
echo ""

