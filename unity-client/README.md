# Unity Client - Starknet Backend Integration

Unity client scripts for integrating with the Starknet backend API.

## Scripts

### `TestStarknetIntegration.cs`
**Purpose:** Comprehensive test script for all backend endpoints

**Features:**
- Tests all 4 API endpoints automatically
- Runs tests on Start (configurable)
- Detailed logging for debugging
- Stores results for chained tests
- Integrates with SecureStorage for private key storage

**Usage:**
1. Attach to any GameObject in your scene
2. Configure `backendUrl` in inspector (default: `http://localhost:3000`)
3. Set `runTestsOnStart` to true to auto-run tests
4. Check Console for test results

**Manual Testing:**
```csharp
var testScript = GetComponent<TestStarknetIntegration>();
testScript.RunTests(); // Run all tests
testScript.TestWalletGenerate(); // Test individual endpoint
```

---

### `StarknetBackendClient.cs`
**Purpose:** Production-ready API client with clean interface

**Features:**
- Singleton pattern for easy access
- Event-based callbacks for UI integration
- Error handling with callbacks
- Configurable timeout
- Clean API methods for each endpoint

**Usage:**
```csharp
// Get the client instance
var client = StarknetBackendClient.Instance;

// Generate wallet (POW-style)
client.GenerateWallet(
    onSuccess: (wallet) => {
        Debug.Log($"Wallet address: {wallet.address}");
        // Save private key securely
        SecureStorage.SaveSecure("starknet_private_key", wallet.privateKey);
    },
    onError: (error) => {
        Debug.LogError($"Failed: {error}");
    }
);

// Create backend-managed wallet
client.CreateWallet("user123",
    onSuccess: (wallet) => {
        Debug.Log($"Created wallet: {wallet.address}");
    }
);

// Create session
client.CreateSession("user123", walletAddress,
    onSuccess: (token) => {
        Debug.Log($"Session token: {token}");
    }
);

// Submit game action
client.SubmitGameAction(sessionToken, "action-1", "game_action",
    onSuccess: (result) => {
        Debug.Log($"Action queued: {result.batchPosition}");
    }
);
```

**Events:**
- `OnWalletGenerated` - Fired when wallet is generated
- `OnWalletCreated` - Fired when wallet is created
- `OnSessionCreated` - Fired when session is created
- `OnGameActionSubmitted` - Fired when game action is submitted
- `OnError` - Fired on any error

---

### `SecureStorage.cs`
**Purpose:** Cross-platform secure storage for private keys

**Features:**
- iOS Keychain integration
- Android Keystore integration
- Fallback to encrypted PlayerPrefs for editor/testing
- Simple API for save/load/delete

**Usage:**
```csharp
// Save private key securely
SecureStorage.SaveSecure("starknet_private_key", privateKey);

// Load private key
string privateKey = SecureStorage.LoadSecure("starknet_private_key");

// Delete private key
SecureStorage.DeleteSecure("starknet_private_key");
```

---

## Setup

1. **Backend Running:**
   ```bash
   cd backend
   bun run dev
   ```

2. **Configure Backend URL:**
   - Set `backendUrl` in inspector or code
   - Default: `http://localhost:3000`
   - For device testing: Use your computer's IP address (e.g., `http://192.168.1.100:3000`)

3. **Network Configuration:**
   - For iOS/Android testing, ensure device and computer are on same network
   - Update `backendUrl` to use computer's IP address
   - Check firewall allows connections on port 3000

---

## Testing

### Quick Test
1. Add `TestStarknetIntegration` script to a GameObject
2. Ensure backend is running (`bun run dev`)
3. Press Play in Unity
4. Check Console for test results

### Manual Testing
Use the public methods in `TestStarknetIntegration`:
- `TestWalletGenerate()`
- `TestWalletCreate(userId)`
- `TestSessionCreate(userId, walletAddress)`
- `TestGameActionSubmit(sessionToken)`

---

## API Endpoints Tested

1. **GET /wallet/generate**
   - Generates new wallet with private key (RESTful GET - doesn't modify state)
   - Returns: `{ privateKey, address, publicKey }`

2. **POST /wallet/create**
   - Creates backend-managed wallet
   - Body: `{ userId: string }`
   - Returns: `{ address, publicKey, encryptedPrivateKey, deploymentStatus }`

3. **POST /session/create**
   - Creates session with wallet address
   - Body: `{ userId: string, walletAddress: string }`
   - Returns: `{ token: string }`

4. **POST /game/action**
   - Submits game action
   - Body: `{ sessionToken: string, action: { id, method, parameters } }`
   - Returns: `{ actionId, status, batchPosition }`

---

## Notes

- **Unity JsonUtility Limitations:** Unity's `JsonUtility` doesn't handle nested objects well. The game action endpoint uses manual JSON string building for the nested `action` object.

- **Network Testing:** For device testing, use your computer's local IP address instead of `localhost`.

- **Error Handling:** All scripts include comprehensive error handling and logging.

- **Secure Storage:** Private keys should always be stored using `SecureStorage` for production builds.

---

## Troubleshooting

**Connection Refused:**
- Ensure backend is running (`bun run dev`)
- Check `backendUrl` is correct
- For device testing, use IP address instead of `localhost`

**JSON Parsing Errors:**
- Check backend response format matches expected models
- Verify Content-Type header is `application/json`

**Timeout Errors:**
- Increase `requestTimeout` in `StarknetBackendClient`
- Check network connectivity
- Verify backend is responding

---

**Last Updated:** November 9, 2025

