# ImmutableX to Starknet Migration

This project helps you move a game backend from ImmutableX to Starknet. It's a working example, not a framework. Take what you need and change what doesn't fit.

## What's Here

The backend runs on NestJS with Bun. It creates wallets, manages session keys, batches transactions, and talks to the AVNU paymaster. The Unity client shows how to store private keys securely on iOS and Android devices.

You'll also find Redis and Postgres in docker-compose, plus a script that builds context files for LLM code reviews.

## Why Not Privy?

You might wonder why this project doesn't use [Privy](https://privy.io) for wallet management, given that Privy supports Starknet. Here's why:

### Privy is Web-First, Not Mobile-First

Privy is designed for web applications (React, Next.js, Vue). It provides:

- ✅ Managed custody with recovery (email, SMS, social)
- ✅ Web-native smart account support
- ❌ **No native iOS SDK**
- ❌ **No native Android SDK**
- ❌ **No game engine support (Unity, Unreal)**

### Your Context is Mobile Games

This toolkit targets:

- Game studios migrating players from ImmutableX
- SEA markets with native mobile priority
- 100K+ concurrent players on iOS/Android
- Real-time transaction requirements

### Technical Limitations with Privy + Unity

If you tried to use Privy with Unity, you'd face:

1. **REST API Only** - No native bindings, forcing HTTP calls for every action
2. **Backend Dependency** - Every transaction requires a round-trip to Privy servers
3. **Latency** - Unacceptable for real-time games (50-200ms per action)
4. **Key Storage** - Privy stores keys on their servers, not on user devices
5. **Offline Signing** - Impossible with Privy; your game can't operate offline
6. **Cost** - Privy charges per transaction/action; expensive at scale
7. **No SecureStorage Integration** - Privy doesn't integrate with iOS Keychain or Android Keystore

### Hybrid Custody vs Managed Custody

| Aspect | This Project | Privy |
|--------|--------------|-------|
| **Key Generation** | Backend (one-time) | Privy (managed) |
| **Key Storage** | Device (iOS Keychain/Android Keystore) | Privy servers (encrypted) |
| **Recovery** | No (by design) | Yes (email/SMS) |
| **Offline Transactions** | Yes (keys on device) | No (requires Privy servers) |
| **Mobile Optimized** | ✅ Yes | ❌ No |
| **Game Optimized** | ✅ Yes | ❌ No |
| **Latency** | Low (local signing) | High (remote signing) |

### When to Use Privy

Privy is excellent for:

- Web3 web applications
- DeFi platforms needing regulatory compliance
- User account recovery requirements
- Non-technical mainstream users
- Western markets with email-first auth

**Use this project if:**

- Building native mobile games
- Targeting SEA markets
- Using Unity/Unreal game engines
- Need local key storage & offline signing
- Prioritizing low latency & high throughput

### If You Need True Self-Custody

Neither this project nor Privy offers pure self-custody (where the user's device is the **only** entity that ever possessed the private key). True self-custody requires:

```
Client generates key → Client stores key → Backend never sees it
```

This project opts for **pragmatic hybrid custody** because:

1. Unity cannot perform native elliptic curve cryptography
2. Generating keys client-side requires complex native plugins
3. Game studios need simplicity over cryptographic purity
4. Mainstream gamers expect recovery, not "if you lose your device, you lose everything"

For pure self-custody on mobile, see [POW](https://github.com/keep-starknet-strange/pow) (React Native + Starknet).

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

### Persistence Layer (Optional)

By default, this project uses Redis for caching. For production, add Postgres for durable storage.

#### Using Redis Only (Default)

```bash
docker-compose up redis
```

Use this for:

- Development/testing
- Short-term session caching
- Temporary deployment job tracking
- Does NOT persist across restarts

#### Adding Postgres (Production)

```bash
# Spin up both Redis and Postgres
docker-compose up

# Initialize schema (if not auto-migrating)
bun run db:migrate
```

Postgres stores:

- User wallet records
- Session history
- Deployment status
- Game action logs
- Failed transaction retries

#### Schema (Suggested)

```sql
-- Users
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wallets
CREATE TABLE wallets (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  address VARCHAR(66) NOT NULL UNIQUE,
  public_key VARCHAR(128) NOT NULL,
  encrypted_private_key VARCHAR(255), -- if backend-managed mode
  deployment_status VARCHAR(50), -- pending, deployed, failed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions
CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  wallet_address VARCHAR(66),
  token_hash VARCHAR(255), -- never store plaintext token
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Game Actions
CREATE TABLE game_actions (
  id VARCHAR(255) PRIMARY KEY,
  session_id VARCHAR(255) REFERENCES sessions(id),
  action_method VARCHAR(100),
  parameters JSONB,
  transaction_hash VARCHAR(255), -- after on-chain
  status VARCHAR(50), -- queued, pending, success, failed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

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

### Wallet Custody Models

**Option 1: Device Storage (Hybrid Custody)**

- Backend generates key initially (trust required)
- Key stored on device after generation
- No recovery if device lost
- Best for: Games prioritizing UX

**Option 2: Backend-Managed**

- Backend keeps encrypted key
- Recovery possible
- Best for: Mainstream users

**Note:** True self-custody requires client-side key generation, which Unity cannot do natively due to JavaScript limitations.

### Understanding the Custody Models

#### What is "Hybrid Custody"?

Hybrid custody means:

- **Setup phase:** Backend generates the private key (requires trusting your backend)
- **Runtime phase:** Key stored locally on device (you have exclusive access after generation)

**Trust assumptions:**

1. Your backend is not compromised during wallet creation
2. HTTPS prevents network interception during key transmission
3. Your backend immediately deletes the key from memory after transmission (implementation detail)

**Realistic risk assessment:**

- If your backend is hacked at setup time → all historical keys compromised
- If your backend is hacked after setup → new wallets safe (old keys already distributed)
- If user's device is compromised → private key compromised

**Why this trade-off exists:**

Unity cannot perform native elliptic curve cryptography. True client-side key generation would require:

- Rust FFI bindings (complex, hard to audit)
- Native iOS/Android plugins (maintenance burden)
- For most game studios, this complexity isn't worth it

#### Device Storage (Local Custody)

Once the private key reaches the device:

- iOS: Stored in Keychain (encrypted by OS)
- Android: Stored in Keystore (encrypted by OS)
- **No recovery possible** - Device loss = key loss

This is intentional. Use it if:

- You trust your backend setup process
- You want keys on device (not server-dependent)
- You accept no recovery for lost devices

#### Backend-Managed (Full Custody)

Alternative option using `POST /wallet/create`:

- Backend generates AND stores encrypted key
- User can recover via backend (if you implement recovery)
- Backend always has access to decrypt keys
- Good for mainstream gamers who lose devices frequently

Use this if:

- You need account recovery
- You're targeting non-technical users
- You want compliance (encrypted keys on server)

### Querying Wallet Status

To check wallet deployment status, query the Starknet network directly using the wallet address. The backend returns `deploymentStatus` when creating a wallet (`queued`, `not_queued`, or `deployed`), but for real-time status, query the blockchain:

```bash
# Using Starknet.js or similar library
# Check if account contract exists at address
provider.getClassAt(walletAddress)

# Or query via RPC
curl -X POST $STARKNET_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "starknet_getClassAt",
    "params": {
      "contract_address": "0x..."
    },
    "id": 1
  }'
```

For backend-managed wallets, deployment status is tracked in the queue. Check Redis for job status if needed.

### Understanding Starknet Account Deployment

#### What Happens When You Deploy a Wallet

**1. Wallet Creation** (`GET /wallet/generate` or `POST /wallet/create`)

```
Backend generates Ed25519 keypair
↓
Derives public key from keypair
↓
Backend stores (secret) or returns private key to client
↓
Backend returns: { address, publicKey, privateKey (optional) }
```

**2. Account Deployment** (happens asynchronously in background)

```
Backend receives deployment job
↓
Uses account class hash + public key to compute contract address
↓
Deploys contract to Starknet (broadcasts transaction)
↓
Waits for L2 confirmation
↓
Stores deployment status in Redis
```

**3. Account Address**

```
address = deriveAddress(
  classHash: ACCOUNT_CLASS_HASH,
  publicKey: userPublicKey,
  constructorData: []
)
```

This address is **deterministic** - same public key always produces same address.

#### Why Account Contracts?

Starknet doesn't have EOAs (Externally Owned Accounts). Every account is a smart contract:

- **Advantage:** Accounts can have custom logic (session keys, multi-sig, etc.)
- **Advantage:** Gas sponsorship works with SNIP-29 paymasters
- **Disadvantage:** Must be deployed before first transaction
- **Disadvantage:** Deployment costs STRK tokens

#### Funding Wallets

After deployment, wallets need STRK to pay for transactions:

**Testnet:** Use faucet
```bash
curl https://faucet.starknet.io/send -X POST
```

**Mainnet:** Transfer STRK from exchange or existing wallet

#### Why Argent Ready?

This project uses [Argent Ready v0.5.0](https://github.com/argentlabs/argent-contracts-starknet) account contracts:

- ✅ Audited by Argent
- ✅ Widely supported
- ✅ Compatible with AVNU paymaster (SNIP-29)
- ✅ Simple + secure
- ❌ Not customizable without forking

If you need custom account logic:

1. Deploy your own account contract (Cairo)
2. Update `ACCOUNT_CLASS_HASH` in your `.env`
3. Make sure your custom contract is SNIP-29 compatible

#### Deployment Failure Scenarios

| Scenario | What Happens | Fix |
|----------|--------------|-----|
| Wallet not funded | Deployment fails | Send STRK to address |
| Invalid class hash | Deployment fails | Verify `ACCOUNT_CLASS_HASH` is correct |
| Network congestion | Deployment times out | Retry (handled automatically with backoff) |
| Contract has bug | Deployment succeeds, transactions fail | Deploy new account contract |

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

## Security Considerations

### Backend Trust Model

This toolkit assumes you trust your backend. Specifically:

1. **At Wallet Creation:**

   - Backend generates private key using `stark.randomAddress()`
   - Key is transmitted to client over HTTPS
   - Backend should NOT log or store the key

2. **At Deployment:**

   - Backend receives public key from client
   - Backend deploys smart account to Starknet
   - Backend never needs the private key after this point

3. **At Transaction Signing:**

   - Private key lives on client device
   - Client signs transaction locally
   - Client sends signed transaction to backend for batching
   - Backend never sees the private key

### Securing Your Backend

**Rate Limiting**

- Wallet creation is capped at 10/minute per IP
- Session creation requires valid JWT
- Game actions require active session token

**Key Management**

- Never log private keys (implement key rotation to purge logs)
- Use HTTPS for all communication
- Rotate JWT_SECRET regularly
- Use environment variables, never hardcode secrets

**Database Security**

- Store encrypted private keys (only if using backend-managed mode)
- Never store plaintext session tokens
- Use parameterized queries (NestJS handles this)

### Device Security (Unity Client)

The SecureStorage wrapper uses:

- **iOS:** Keychain Services (Apple's secure enclave)
- **Android:** KeyStore (Google's TEE, if available)
- **Editor/Testing:** Encrypted PlayerPrefs (NOT for production)

**Known Limitations:**

- Jailbroken/rooted devices can expose keys
- Device malware can intercept keys
- Backup/restore may lose keys (depends on OS)

### What This Is NOT

This is **not** a self-custodial system in the purest sense:

- Backend is involved at key generation (trust required)
- Client never cryptographically proves they generated the key
- Backend could theoretically log keys during transmission

For true self-custody (zero backend involvement), use POW or similar.

## Notes

Rate limiting caps wallet creation at 10 requests per minute. Session tokens gate which actions players can call. The transaction batch processor watches receipts and requeues anything that fails.

The Unity secure storage classes handle iOS Keychain and Android Keystore. Use them when storing private keys on device.

## AVNU Paymaster Integration

### What is a Paymaster?

A paymaster is a smart contract that pays gas fees on behalf of users (SNIP-29 standard on Starknet).

- **Sponsored mode:** Paymaster (you) pays 100% of gas
- **Default mode:** User pays gas in USDC or other token
- **No paymaster:** User pays gas in STRK

### Setting Up AVNU Paymaster

#### 1. Get AVNU Credentials

Contact AVNU on [Telegram](https://t.me/avnu_fi)

Request:

- Paymaster API endpoint
- API key for testnet
- (Optional) API key for mainnet

#### 2. Configure `.env`

**Required:**
```bash
AVNU_API_KEY=your_api_key_here
PAYMASTER_URL=https://sepolia.paymaster.avnu.fi # testnet
```

**Optional:** Which gas token to use
```bash
PAYMASTER_MODE=sponsored # or 'default'
GAS_TOKEN_ADDRESS=0x... # required for 'default' mode
```

#### 3. Test It

```bash
# Test paymaster health
curl http://localhost:3000/paymaster/test
```

Response should show:
```json
{
  "name": "AVNU Paymaster",
  "version": "1.0",
  "isPaused": false,
  "supportedTokens": ["0x...", "0x..."]
}
```

#### 4. Monitor Paymaster Balance

AVNU charges by transaction. Monitor:

- Remaining credits at AVNU dashboard
- Gas used per transaction
- Cost scaling as you grow

### Cost Estimation

| Mode | Gas Cost | Who Pays |
|------|----------|----------|
| Sponsored | ~3000-5000 gas | You (via AVNU credits) |
| Default USDC | ~3000-5000 gas | User (from USDC balance) |
| STRK direct | ~3000-5000 gas | User (from STRK balance) |

**Rough costs (Sepolia testnet):**

- Transfer: ~3000 gas × 0.001 STRK/unit = 3 STRK (~$0.01)
- With paymaster: 0 STRK (you pay AVNU)

### Fallback if Paymaster Fails

Currently, if paymaster fails, transaction fails. Future improvement:

- Fallback to user-paid gas
- Fallback to different paymaster
- Queue retry with exponential backoff

### Debugging Paymaster Issues

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid API Key" | Wrong AVNU_API_KEY | Verify key in dashboard |
| "Insufficient credits" | Out of prepaid gas | Top up AVNU credits |
| "Account not compatible" | Account doesn't support SNIP-29 | Use Argent Ready account |
| "Gas estimation failed" | Transaction invalid | Check contract address & method |
| Timeout | AVNU service slow | Retry with backoff |

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
- "Account not compatible" - Ensure account supports SNIP-29
- CORS errors - Paymaster calls should be from backend, not browser

## What's Next

Tune batch sizes for your load. Add Postgres if you need persistent storage. Extend the Unity sample with your game logic.