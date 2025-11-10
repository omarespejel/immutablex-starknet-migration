# ImmutableX to Starknet Migration Toolkit

A pragmatic toolkit for game studios migrating from ImmutableX to Starknet. This isn't a framework—it's working code. Take what helps, change what doesn't.

## The Problem We Solve

Unity games can't generate cryptographic keys natively. JavaScript libraries don't run in C#. Game studios need a solution that works today, not a perfect architecture that requires months of native plugin development.

This toolkit provides that solution.

## What You Get

**Backend (NestJS + Bun)**

- Wallet generation with two custody models
- Session keys that expire after 24 hours
- Transaction batching (100 actions per batch)
- AVNU paymaster integration for gasless transactions
- Redis queue for reliable async processing

**Unity Client**

- Secure key storage using iOS Keychain and Android Keystore
- REST API integration that works with Unity's networking
- Sample test scripts showing real implementation

**Infrastructure**

- Docker Compose for Redis and PostgreSQL
- Environment configuration for testnet and mainnet
- Context generation script for AI code reviews

## The Trust Trade-off

This toolkit makes a deliberate compromise. The backend generates private keys because Unity cannot. This means you must trust your backend during wallet creation. After that, keys live on the user's device.

We chose pragmatism over purity. Game studios need solutions that ship, not cryptographic perfection that never launches.

## Why Not Use Privy?

Privy is excellent for web applications. It doesn't work for mobile games.

**Privy's Limitations for Games:**

- No native Unity SDK
- No iOS or Android SDKs  
- REST API adds 50-200ms latency per action
- Keys stored on Privy servers, not devices
- No offline transaction signing
- Per-transaction pricing expensive at scale

**Our Approach:**

- Native Unity integration
- Keys stored on device
- Local transaction signing
- One-time backend trust at creation
- No ongoing fees

## Custody Models

### Device Storage (Recommended for Games)

The backend generates a key once and sends it to the device. The device stores it securely and the backend forgets it.

```bash
GET /wallet/generate

# Returns: { privateKey, address, publicKey }
```

**Trust required:** During initial generation only  

**Recovery:** None—device loss means key loss  

**Best for:** Games prioritizing user experience

### Backend-Managed (Optional)

The backend generates and stores encrypted keys. Users can recover accounts but must trust your infrastructure.

```bash
POST /wallet/create

# Body: { userId: "user123" }

# Returns: { address, publicKey, deploymentStatus }
```

**Trust required:** Ongoing  

**Recovery:** Possible through backend  

**Best for:** Non-technical users who lose devices

## Quick Start

### Prerequisites

- Bun runtime
- Docker
- Unity 2022.3.15f1 or newer
- Alchemy API key (get from [dashboard](https://dashboard.alchemy.com))
- AVNU paymaster key (contact [AVNU on Telegram](https://t.me/avnu_fi))

### Backend Setup

```bash
# Clone and enter project
cd backend

# Copy environment template
cp .env.example .env

# Add your keys to .env
# STARKNET_RPC=your_alchemy_url
# AVNU_API_KEY=your_avnu_key
# JWT_SECRET=$(openssl rand -base64 32)
# ENCRYPTION_KEY=$(openssl rand -hex 16)

# Install dependencies
bun install

# Start Redis (required for batching)
docker-compose up -d redis

# Run backend
# Option 1: With Redis (enables batching, wallet deployment queues)
bun run dev:redis

# Option 2: Without Redis (faster, no queues, no batching)
bun run dev
```

**Note:** The default `bun run dev` disables Redis for faster development. Use `bun run dev:redis` if you need batching or wallet deployment queues.

The server runs on `http://localhost:3000`.

### Unity Setup

1. Open the Unity project
2. Create an empty GameObject named "StarknetTester"
3. Add the TestStarknetIntegration component
4. Press Play
5. Check the Console for test results

## How It Works

### Wallet Generation

The backend uses Starknet.js to generate Ed25519 keypairs. For device storage mode, it returns the private key. For managed mode, it encrypts and stores the key.

### Account Deployment

Starknet accounts are smart contracts. We use Argent's audited account contracts. The AVNU paymaster sponsors deployment gas fees.

### Session Keys

Session keys enable game actions without exposing the master key. They expire after 24 hours and have restricted permissions.

### Transaction Batching

Game actions queue until we have 100, then batch submit to reduce gas costs. Failed transactions automatically retry with exponential backoff.

**Requires Redis:** Batching only works when Redis is enabled. Use `bun run dev:redis` instead of `bun run dev`.

## Security Considerations

**What This Is:**

- A practical solution for game studios
- Secure storage on mobile devices
- Rate-limited API endpoints
- Encrypted keys when stored on backend

**What This Isn't:**

- Pure self-custody (backend generates keys)
- Suitable for DeFi applications
- A trustless protocol

For true self-custody, see [POW](https://github.com/keep-starknet-strange/pow) which uses React Native to generate keys client-side.

## Project Structure

```
backend/
├── src/
│   ├── wallet/        # Key generation and deployment
│   ├── session/       # JWT session management
│   ├── game/          # Action batching
│   └── paymaster/     # AVNU integration
unity-client/
├── Assets/
│   └── Scripts/       # Unity integration
docker-compose.yml     # Redis and PostgreSQL
```

## Testing

```bash
# Unit tests
bun test

# E2E tests
bun test:e2e

# Paymaster integration
bun run test/paymaster-test.ts

# Transaction batching test
bun run test/batch-test.ts
```

### Testing Transaction Batching

The batching system groups 100 actions together to save gas costs. **Important:** Batching requires Redis to be enabled.

**Start Backend WITH Redis (required for batching):**

```bash
cd backend
bun run dev:redis  # Use this instead of 'bun run dev'
```

The default `bun run dev` sets `SKIP_REDIS=true` which disables batching. Use `dev:redis` to enable it.

**Quick Test (Backend):**

```bash
cd backend
bun run test/batch-test.ts
```

This script:
1. Generates a wallet
2. Creates a session
3. Sends 105 actions (triggers batch at 100)
4. Shows batch positions and triggers

**Unity Load Test:**

1. Add `LoadTestBatching.cs` to a GameObject
2. Set `actionsToSend` to 105
3. Press Play
4. Watch Console for batch trigger at action 100

**Monitor Backend Logs:**

Watch for batch submission:
```
[TransactionBatchProcessor] BATCH: Submitting batch of 100 actions
[PaymasterService] Sponsoring transaction...
```

**Check Redis Queue:**

```bash
redis-cli -p 6379
LLEN bull:transactions:wait
```

**What to Expect:**

- Actions 0-99: Queued, batch position increments
- Action 100: Batch triggers, first 100 actions submit
- Actions 100+: New batch starts, position resets

**Common Issues:**

- **No batch submission:** Redis not running or `SKIP_REDIS=true` in .env
- **Batch fails:** Wallet not deployed or paymaster not configured
- **Queue disabled:** Check Redis connection and environment variables

## Production Considerations

- Add PostgreSQL for persistent storage
- Implement key rotation policies
- Monitor paymaster credit balance
- Set up error alerting
- Configure rate limiting per user
- Add transaction retry dead letter queue

## Support

Built by developers who've actually shipped games. We know the trade-offs you face.

For issues, open a GitHub issue. For architecture discussions, read the code—it's more honest than documentation.

## License

MIT
