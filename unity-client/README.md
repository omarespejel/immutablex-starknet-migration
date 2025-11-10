# Unity Starknet Integration

Unity scripts for connecting to the Starknet backend. These handle secure key storage and REST API communication.

## What's Included

**SecureStorage.cs**  

Platform-specific secure storage wrapper. Uses iOS Keychain, Android Keystore, or encrypted PlayerPrefs for editor testing.

**StarknetBackendClient.cs**  

REST API client for wallet operations, sessions, and game actions. Handles retries and error cases.

**TestStarknetIntegration.cs**  

Integration test that validates all endpoints. Run this first to verify your setup.

**SelfCustodyTest.cs**  

Tests the self-custody wallet flow. Shows how to generate and store keys on device.

**WalletComparisonTest.cs**  

Compares self-custody versus managed wallets. Useful for understanding the trade-offs.

## Installation

1. Copy the Scripts folder to your Unity project's Assets
2. Ensure you have Unity 2022.3.15f1 or newer
3. The scripts use UnityWebRequest (no external dependencies)

## Basic Usage

### Generate a Wallet (Self-Custody)

```csharp
IEnumerator GenerateWallet()
{
    var client = GetComponent<StarknetBackendClient>();
    yield return client.GenerateWallet((wallet) => 
    {
        // Store private key securely on device
        SecureStorage.SaveSecure("private_key", wallet.privateKey);
        Debug.Log($"Wallet created: {wallet.address}");
    });
}
```

### Create a Session

```csharp
IEnumerator CreateSession()
{
    var client = GetComponent<StarknetBackendClient>();
    yield return client.CreateSession(userId, walletAddress, (token) =>
    {
        // Store session token for game actions
        PlayerPrefs.SetString("session_token", token);
    });
}
```

### Submit Game Action

```csharp
IEnumerator SubmitAction()
{
    var client = GetComponent<StarknetBackendClient>();
    var action = new GameAction
    {
        id = System.Guid.NewGuid().ToString(),
        method = "game_action",
        parameters = new { score = 100 }
    };
    
    yield return client.SubmitAction(sessionToken, action, (result) =>
    {
        Debug.Log($"Action queued at position {result.batchPosition}");
    });
}
```

## Platform-Specific Notes

### iOS

Keys are stored in the iOS Keychain. They persist across app updates but not device restores (unless iCloud Keychain is enabled).

### Android

Keys are stored in the Android Keystore. On devices with hardware security modules, keys are hardware-backed.

### Editor

For testing, keys are stored in PlayerPrefs with basic encryption. Never use this in production.

## Testing Your Integration

1. Add TestStarknetIntegration to a GameObject
2. Set the backend URL (default: http://localhost:3000)
3. Check "Run Tests On Start"
4. Press Play
5. Watch the Console for results

Expected output:

```
[TEST 1] ✅ SUCCESS - Wallet generated!
[TEST 2] ✅ SUCCESS - Wallet created!
[TEST 3] ✅ SUCCESS - Session created!
[TEST 4] ✅ SUCCESS - Game action submitted!
```

## Error Handling

The client includes automatic retry with exponential backoff. Network errors retry up to 3 times. Server errors are surfaced immediately.

Common errors:

**Connection Refused**  

Backend isn't running. Start it with `bun run dev`.

**Invalid Session**  

Session expired after 24 hours. Create a new session.

**Rate Limited**  

Too many wallet creations. Wait 60 seconds.

## Security Best Practices

1. Never log private keys
2. Clear sensitive data from memory after use
3. Use HTTPS in production
4. Implement certificate pinning for production
5. Obfuscate the built Unity application

## Mobile Optimization

- Batch API calls where possible
- Cache session tokens locally
- Implement offline queue for actions
- Use compression for large payloads
- Monitor battery usage during polling

## Troubleshooting

**Script Not Found**  

Ensure scripts are in Assets/Scripts/. Unity needs to compile them.

**Null Reference Exception**  

Check that backend URL is set and ends with no trailing slash.

**iOS Build Fails**  

Add iOS.Security framework in Xcode project settings.

**Android Permissions**  

No special permissions needed. Keystore is accessible by default.

## Next Steps

1. Run the test suite to verify integration
2. Implement your game-specific actions
3. Add error recovery flows
4. Test on actual devices
5. Monitor transaction success rates

## Support

These scripts are battle-tested in production games. They handle the edge cases Unity developers actually encounter.

For Unity-specific issues, check the Console first. For backend issues, check the server logs.
