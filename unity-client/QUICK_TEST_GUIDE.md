# Quick Test Guide - Self-Custody Wallet

## ✅ Backend Status

Both endpoints are working correctly:

- **Self-Custody** (`GET /wallet/generate`): ✅ Returns `privateKey`
- **Backend-Managed** (`POST /wallet/create`): ✅ Returns `encryptedPrivateKey` (no `privateKey`)

## 🎮 Testing in Unity

### Option 1: Focused Self-Custody Test

**Script:** `SelfCustodyTest.cs`

**Steps:**
1. Open Unity and load your scene
2. Create an empty GameObject (right-click in Hierarchy → Create Empty)
3. Name it "SelfCustodyTester"
4. Select the GameObject
5. In Inspector, click "Add Component"
6. Search for "Self Custody Test" and add it
7. Verify `backendUrl` is set to `http://localhost:3000` (or your backend URL)
8. Press Play ▶️
9. Check the Unity Console for test results

**Expected Output:**
```
=== TESTING SELF-CUSTODY WALLET (POW-STYLE) ===
✅ Request successful!
✅ SELF-CUSTODY CONFIRMED - Private key received!
🔑 USER HAS FULL CONTROL OF PRIVATE KEY
  Address: 0x...
  Private Key (first 20 chars): 0x...
💾 Private key saved to secure device storage
✅ THIS IS TRUE SELF-CUSTODY - Like POW!
```

### Option 2: Comparison Test (Recommended)

**Script:** `WalletComparisonTest.cs`

**Steps:**
1. Create an empty GameObject named "WalletComparisonTester"
2. Add the `WalletComparisonTest` component
3. Press Play ▶️
4. Watch the Console for side-by-side comparison

**Expected Output:**
- Tests both wallet types
- Shows comparison table
- Highlights the key differences

### Option 3: Full Integration Test

**Script:** `TestStarknetIntegration.cs`

**Steps:**
1. Use the existing `TestStarknetIntegration` script
2. It tests all endpoints including wallet generation
3. More comprehensive but less focused on self-custody verification

## 🔍 What to Look For

### ✅ Success Indicators:

1. **Private Key Received:**
   ```
   ✅ SELF-CUSTODY CONFIRMED - Private key received!
   ```

2. **Key Saved Securely:**
   ```
   💾 Private key saved to secure device storage
   ```

3. **Verification Passed:**
   ```
   ✅ Verification: Private key successfully saved and retrieved
   ```

### ❌ Failure Indicators:

1. **Connection Error:**
   ```
   ❌ Request failed: Connection refused
   ```
   **Fix:** Make sure backend is running (`cd backend && bun run dev`)

2. **No Private Key:**
   ```
   ❌ No private key in response - NOT self-custody
   ```
   **Fix:** Check backend logs, verify endpoint is `/wallet/generate`

3. **JSON Parse Error:**
   ```
   ❌ Error parsing response: ...
   ```
   **Fix:** Check backend response format

## 🧪 Manual Verification

After Unity test completes, verify the key was saved:

```csharp
// In Unity Console or another script:
string savedKey = SecureStorage.LoadSecure("StarknetPrivateKey");
Debug.Log("Retrieved key: " + savedKey.Substring(0, 20) + "...");
```

## 📊 Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| Backend Running | ✅ | Port 3000 active |
| Self-Custody Endpoint | ✅ | Returns `privateKey` |
| Backend-Managed Endpoint | ✅ | Returns `encryptedPrivateKey` |
| Unity Test Scripts | ✅ | Ready to use |

## 🚀 Next Steps After Testing

1. **If tests pass:** You're ready to integrate self-custody wallets into your game!
2. **Store keys securely:** Use `SecureStorage` for production (iOS Keychain / Android Keystore)
3. **Never send keys back:** The private key should never be sent to the backend again
4. **Sign transactions locally:** Use the private key to sign transactions in Unity

## 🐛 Troubleshooting

### Backend Not Responding
```bash
# Check if backend is running
lsof -ti:3000

# Start backend if not running
cd backend
bun run dev
```

### Unity Can't Connect
- Check firewall settings
- Verify `backendUrl` is correct
- Try `http://127.0.0.1:3000` instead of `localhost`

### SecureStorage Not Working
- On iOS/Android: Uses Keychain/Keystore (secure)
- On Editor: Falls back to PlayerPrefs (less secure, but works for testing)

## 📝 Test Scripts Location

All test scripts are in: `unity-client/Assets/Scripts/`

- `SelfCustodyTest.cs` - Focused self-custody test
- `WalletComparisonTest.cs` - Side-by-side comparison
- `TestStarknetIntegration.cs` - Full integration test suite

