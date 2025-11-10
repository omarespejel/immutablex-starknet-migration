# Backend API

NestJS backend for ImmutableX Starknet migration with wallet management, session handling, and game actions.

## 🚀 Quick Start

### Install Dependencies

```bash
bun install
```

### Development (Without Redis - Recommended)

The application runs without Redis by default for development:

```bash
bun run dev
```

This automatically sets `SKIP_REDIS=true` to skip Bull queue initialization.

### Development (With Redis)

If you need Redis/Bull queues for testing:

```bash
# Start Redis
docker-compose up -d redis

# Run with Redis
bun run dev:redis
```

## 📋 Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Development - Skip Redis (recommended for local dev)
SKIP_REDIS=true

# Starknet Configuration
STARKNET_RPC=https://starknet-sepolia.public.blastapi.io
ACCOUNT_CLASS_HASH=0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f

# AVNU Paymaster Configuration
AVNU_PAYMASTER_URL=https://sepolia.paymaster.avnu.fi
AVNU_API_KEY=your_api_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# Server Configuration
PORT=3000
ALLOWED_ORIGINS=*
```

## 🔧 Available Scripts

- `bun run dev` - Start development server (without Redis)
- `bun run dev:redis` - Start development server (with Redis)
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run test` - Run tests

## 📝 Notes

- **Development Mode**: By default, `bun run dev` runs without Redis. Queue-dependent features will log warnings but won't crash.
- **Production**: For production, ensure Redis is running and set `SKIP_REDIS=false` or remove it.
- **Starknet.js v8**: This project uses Starknet.js v8.7.0 with RPC spec version 0.9.0.

## 🐛 Troubleshooting

### Port Already in Use

If you see `Error: Failed to start server. Is port 3000 in use?`:

```bash
# Quick fix - kill processes on port 3000
./kill-port.sh

# Or manually:
lsof -ti:3000 | xargs kill -9

# Then restart
bun run dev
```

### Application Hangs During Startup

1. Use `SKIP_REDIS=true` for development (default)
2. Check Redis connection if using `dev:redis`
3. See `DEBUGGING_ASSESSMENT.md` for detailed troubleshooting

This project was created using `bun init` in bun v1.3.1. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
