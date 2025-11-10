# Testing Self-Custody Wallet (POW-Style)

This guide shows you exactly how to test if the **self-custody version** (POW-style) works correctly.

## 🧪 TEST THE SELF-CUSTODY WALLET

### Step 1: Test with cURL First

Make sure the backend is running:

```bash
cd backend
bun run dev
```

In another terminal, test the self-custody endpoint:

```bash
curl -X GET http://localhost:3000/wallet/generate
```

**Expected Response (Self-Custody):**

```json
{
  "privateKey": "0x42a990ebbcb7fc0829bfdeb5332ef3153a394b7bb861434c27cecdd73223cf5",
  "address": "0x2392f7c6d038573170bf419cf771dd4cad53f54980e54f0040e2b9b6c3955a6",
  "publicKey": "0x7af45cc4f70ed585ad8e29a70403877cd8f1e3705a275ef1b2bde94cb772e3"
}
```

**✅ KEY INDICATOR:** You receive the `privateKey` - this proves it's self-custody!

### Step 2: Test in Unity

Two test scripts are available:

#### Option A: Focused Self-Custody Test

Use `SelfCustodyTest.cs` for a focused test that:
- Tests only the self-custody endpoint
- Verifies private key is returned
- Saves it securely using SecureStorage
- Provides clear success/failure indicators

**To use:**
1. Attach `SelfCustodyTest.cs` to a GameObject in Unity
2. Set the `backendUrl` if different from `http://localhost:3000`
3. Run the scene
4. Check the Unity Console for test results

#### Option B: Comparison Test

Use `WalletComparisonTest.cs` to see both wallet types side-by-side:
- Tests self-custody wallet (`/wallet/generate`)
- Tests backend-managed wallet (`/wallet/create`)
- Shows a comparison table
- Highlights the differences

**To use:**
1. Attach `WalletComparisonTest.cs` to a GameObject in Unity
2. Set the `backendUrl` if different from `http://localhost:3000`
3. Run the scene
4. Check the Unity Console for comparison results

### Step 3: Compare with Non-Self-Custody

Test the other endpoint to see the difference:

```bash
# Test the managed wallet (NOT self-custody)
curl -X POST http://localhost:3000/wallet/create \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-123"}'
```

**Response (NOT Self-Custody):**

```json
{
  "address": "0x1097a65b2dab3b1d351cda2d75e7190cfdf057eed0c237d41c710b24d3883fb",
  "publicKey": "0x49b9eb85a8006be0ca87031582661b26daa3a0721c9d218d68ddb499a00863f",
  "encryptedPrivateKey": "fc39ea93fa5a93570f49cf19647aaded:...",
  "deploymentStatus": "not_queued"
}
```

**❌ NO `privateKey` field** - backend keeps it encrypted!

## 📊 HOW TO VERIFY SELF-CUSTODY:

| Test | Self-Custody (POW-style) | Backend-Managed |
|------|--------------------------|-----------------|
| **Endpoint** | `/wallet/generate` | `/wallet/create` |
| **Method** | GET | POST |
| **Returns privateKey?** | ✅ YES | ❌ NO |
| **Who has the key?** | User only | Backend |
| **Can recover if lost?** | ❌ No | ✅ Yes |
| **True Web3?** | ✅ Yes | ❌ No |

## 🎯 PROOF IT'S WORKING:

1. **If you get `privateKey` in response** = ✅ Self-custody works!
2. **If Unity can save it locally** = ✅ Device control confirmed
3. **If backend never sees it again** = ✅ True decentralization

## 🔒 SECURITY TEST:

To prove it's truly self-custody:

1. Generate a wallet using `/wallet/generate`
2. Save the private key locally (Unity SecureStorage)
3. Stop the backend (`Ctrl+C`)
4. You still have your key! ✅
5. Backend can't access it! ✅

This is exactly how POW works - user has complete control!

## 🐛 Troubleshooting

### Backend Error: "undefined is not an object"

If you see this error, try:

1. **Restart the backend:**
   ```bash
   cd backend
   # Stop current process (Ctrl+C)
   bun run dev
   ```

2. **Check backend logs** for detailed error messages

3. **Verify dependencies are installed:**
   ```bash
   cd backend
   bun install
   ```

### Unity Can't Connect

1. **Verify backend is running:**
   ```bash
   curl http://localhost:3000/health
   # or
   lsof -ti:3000
   ```

2. **Check firewall settings** - Unity might be blocked

3. **Verify URL in Unity:** Make sure `backendUrl` is set correctly

### Private Key Not Saved

1. **Check SecureStorage implementation** - Make sure `SecureStorage.cs` exists
2. **Check platform support** - SecureStorage works on iOS/Android, uses PlayerPrefs on Editor
3. **Check Unity Console** for any error messages

## 📝 Test Scripts Location

- `unity-client/Assets/Scripts/SelfCustodyTest.cs` - Focused self-custody test
- `unity-client/Assets/Scripts/WalletComparisonTest.cs` - Side-by-side comparison
- `unity-client/Assets/Scripts/TestStarknetIntegration.cs` - Full integration test suite

