# ImmutableX to Starknet Migration

This project helps you move a game backend from ImmutableX to Starknet. It's a working example, not a framework. Take what you need and change what doesn't fit.

## What's Here

The backend runs on NestJS with Bun. It creates wallets, manages session keys, batches transactions, and talks to the AVNU paymaster. The Unity client shows how to store private keys securely on iOS and Android devices.

You'll also find Redis and Postgres in docker-compose, plus a script that builds context files for LLM code reviews.

## Setup

Install Bun, Docker, and Unity 2022.3.15f1 or newer.

### Environment Setup

1. Copy `.env.example` to `.env` in the `backend` folder.

2. Get your Alchemy API key from the [Alchemy dashboard](https://dashboard.alchemy.com). Add it to `STARKNET_RPC` in your `.env` file.

3. Contact [AVNU on Telegram](https://t.me/avnu_fi) for a paymaster API key. Add it to `AVNU_API_KEY` in your `.env` file.

4. Generate security keys:

   ```bash
   # Generate JWT secret (32+ characters)
   openssl rand -base64 32
   
   # Generate encryption key (32 hex characters)
   openssl rand -hex 16
   ```

   Add these to `JWT_SECRET` and `ENCRYPTION_KEY` in your `.env` file.

5. Run `bun install` in the `backend` folder.

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
GET /wallet/generate
# Returns: { privateKey, address, publicKey }
```

The managed path encrypts the key on the backend:

```bash
POST /wallet/create
Body: { userId: "user123" }
# Returns: { address, publicKey, encryptedPrivateKey, deploymentStatus }
```

Wallet deployment happens asynchronously. The backend queues each deployment job and processes it with retries.

### Wallet Management Options

**Option 1: Device Storage (POW-style) - TRUE SELF-CUSTODY**

- `POST /wallet/generate` - Returns private key
- User stores on device
- No recovery if device lost
- True decentralization

**Option 2: Backend Managed - BETTER UX**

- `POST /wallet/create` - Backend stores encrypted
- Can implement recovery
- Not true self-custody
- Easier for mainstream users

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

## Testing

### Paymaster Testing

Test the AVNU paymaster integration:

```bash
# Standalone test script (requires AVNU_API_KEY in .env)
cd backend
bun run test/paymaster-test.ts

# Test via API endpoints (backend must be running)
curl http://localhost:3000/paymaster/test

# Test sponsored transaction
curl -X POST http://localhost:3000/paymaster/test-sponsor \
  -H "Content-Type: application/json" \
  -d '{"userAddress": "0x1234..."}'

# Run integration tests
bun test test/integration-paymaster.test.ts
```

**Testing Checklist:**
- Contact AVNU for test API key
- Verify paymaster health endpoint
- Get list of supported gas tokens
- Build a test transaction
- Check sponsor activity/balance
- Test error handling (invalid API key)
- Test with real testnet account (if available)

**Common Issues:**
- "Invalid API Key" - Contact AVNU team on [Telegram](https://t.me/avnu_fi) for valid key
- "Insufficient credits" - Ask AVNU for test credits
- "Account not compatible" - Ensure account supports SNIP-9
- CORS errors - Paymaster calls should be from backend, not browser

## What's Next

Tune batch sizes for your load. Add Postgres if you need persistent storage. Extend the Unity sample with your game logic.