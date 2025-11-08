# ImmutableX to Starknet Migration

This project helps you move a game backend from ImmutableX to Starknet. It's a working example, not a framework. Take what you need and change what doesn't fit.

## What's Here

The backend runs on NestJS with Bun. It creates wallets, manages session keys, batches transactions, and talks to the AVNU paymaster. The Unity client shows how to store private keys securely on iOS and Android devices.

You'll also find Redis and Postgres in docker-compose, plus a script that builds context files for LLM code reviews.

## Setup

Install Bun, Docker, and Unity 2022.3.15f1 or newer.

In the `backend` folder, copy `.env.example` to `.env`. Fill in your Starknet RPC endpoint, AVNU API key, and a JWT secret. Then run `bun install`.

## Running It

Start Redis first:

```bash
docker-compose up redis
```

Then start the backend:

```bash
cd backend
bun run dev
```

The server runs on port 3000. Point your Unity client there.

## How It Works

**Wallets**

You can generate wallets two ways. The simple path (POW-style) returns a private key for the client to store:

```bash
POST /wallet/generate
# Returns: { privateKey, address, publicKey }
```

The managed path encrypts the key on the backend:

```bash
POST /wallet/create
Body: { userId: "user123" }
# Returns: { address, publicKey, encryptedPrivateKey, deploymentStatus }
```

Wallet deployment happens asynchronously. The backend queues each deployment job and processes it with retries.

**Sessions**

Create a session with a wallet address. You get a JWT token that expires in 24 hours:

```bash
POST /session/create
Body: { userId: "user123", walletAddress: "0x..." }
# Returns: { token }
```

**Game Actions**

Submit actions through the REST API. The backend batches them and sponsors transactions through AVNU:

```bash
POST /game/action
Body: {
  sessionToken: "jwt_token",
  action: {
    id: "action_123",
    method: "game_action",
    parameters: { ... }
  }
}
```

Actions queue up until there are 100, then they batch and submit. Failed transactions get requeued automatically.

## Project Structure

```
immutablex-starknet-migration/
├── backend/
│   ├── src/
│   │   ├── wallet/         # Wallet generation and deployment
│   │   ├── session/        # JWT sessions
│   │   ├── paymaster/      # AVNU integration
│   │   └── game/           # REST API and batch processor
│   └── test/               # Unit and e2e tests
├── unity-client/           # Unity sample with secure storage
├── docker-compose.yml      # Redis and Postgres
└── generate-context.sh     # LLM context builder
```

## Notes

Rate limiting caps wallet creation at 10 requests per minute. Session tokens gate which actions players can call. The transaction batch processor watches receipts and requeues anything that fails.

The Unity secure storage classes handle iOS Keychain and Android Keystore. Use them when storing private keys on device.

## What's Next

Tune batch sizes for your load. Add Postgres if you need persistent storage. Extend the Unity sample with your game logic.