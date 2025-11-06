# ImmutableX to Starknet Migration Kit

## Purpose
This kit shows how to move an ImmutableX game backend onto Starknet. The repository carries a NestJS service that speaks to Starknet, a set of queue workers for batching player actions, and a Unity client ready to hook into the new API. Everything is trimmed to the pieces you need to study, modify, and ship.

## Components at a Glance
- **Backend** – NestJS running on Bun. Handles wallet creation, session keys, Bull queues, and the AVNU paymaster.
- **Unity client** – Minimal C# project with secure key storage helpers for iOS and Android.
- **Infrastructure** – Redis and Postgres definitions in `docker-compose.yml` plus helper scripts for generating LLM context.

## Getting Started
1. Install Bun, Docker, and Unity 2022.3.15f1 or later.
2. In `backend/`, copy `.env.example` to `.env` and supply Starknet RPC, AVNU credentials, and JWT secrets.
3. Run `bun install` inside `backend/`.

### Running the Stack
Open three terminals:
1. `docker-compose up redis` – starts the queue store. Add Postgres if you need the database.
2. `cd backend && bun run dev` – launches the NestJS server on port 3000.
3. Optional: run `bun test` for unit and e2e coverage.

The Unity project can now point to `http://localhost:3000`. Use the provided secure storage classes when persisting keys on device.

## Operational Notes
- Wallet creation is asynchronous. Each request queues a deployment job handled by Bull with exponential backoff.
- Session tokens expire after 24 hours and gate which in-game actions a player may call.
- The transaction batch processor sponsors calls through the AVNU paymaster and monitors receipts to requeue failures.

## Project Layout
```
immutablex-starknet-migration/
├── backend/                # NestJS service and Bull processors
│   ├── src/
│   │   ├── wallet/         # Wallet creation and deployment queue
│   │   ├── session/        # JWT sessions and action execution
│   │   ├── paymaster/      # AVNU integration helpers
│   │   └── game/           # WebSocket gateway and batch processor
│   ├── test/               # Bun-based unit and e2e tests
│   └── package.json
├── unity-client/           # Unity sample with secure storage plugins
├── docker-compose.yml      # Redis and Postgres services
└── generate-context.sh     # Builds a context file for LLM reviews
```

## Next Steps
- Adjust the queue and batch sizes for your production load.
- Extend the Unity sample with gameplay events tied to the WebSocket gateway.
- Wire Postgres into the backend once you define persistence needs.
