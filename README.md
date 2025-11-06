# ImmutableX to Starknet Migration Kit

## Architecture

Unity → Backend API → Starknet

## Tech Stack

- Backend: NestJS + Bun + Starknet.js
- Frontend: Unity (C#)
- Blockchain: Starknet
- Queue: Redis + Bull
- Paymaster: AVNU

## Quick Start

### Prerequisites

- Bun installed
- Docker installed
- Unity 2022.3.15f1+

### Backend Setup

```bash
cd backend
bun install
cp .env.example .env
# Edit .env with your configuration
bun run dev
```

### Unity Setup

1. Open unity-client in Unity
2. Import NativeWebSocket
3. Configure backend URL
4. Build for mobile

## Features

- ✅ Self-custody wallets
- ✅ Session keys (24hr)
- ✅ Transaction batching (100 actions)
- ✅ AVNU Paymaster
- ✅ WebSocket real-time

## Environment Variables

Copy `.env.example` to `.env` and configure:

- AVNU_API_KEY
- JWT_SECRET
- STARKNET_RPC

## Running Everything Together

### Terminal 1: Start Redis
```bash
docker-compose up redis
```

### Terminal 2: Start Backend
```bash
cd backend
bun run dev
```

## Verification Checklist

- ✅ Backend Running: http://localhost:3000
- ✅ Redis Connected: Check logs for connection
- ✅ Wallet Creation: Test endpoint works
- ✅ Session Creation: JWT token returned
- ✅ WebSocket: Can connect from client

## Project Structure

```
immutablex-starknet-migration/
├── backend/
│   ├── src/
│   │   ├── wallet/
│   │   ├── session/
│   │   ├── paymaster/
│   │   ├── game/
│   │   └── main.ts
│   ├── package.json
│   ├── bun.lockb
│   └── .env
├── unity-client/
│   └── (Unity project files)
├── docker-compose.yml
├── README.md
└── .gitignore
```
