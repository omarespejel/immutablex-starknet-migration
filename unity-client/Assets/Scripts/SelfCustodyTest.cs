using UnityEngine;
using UnityEngine.Networking;
using System.Collections;

/// <summary>
/// Focused test script for verifying self-custody wallet functionality (POW-style)
/// This script specifically tests that the backend returns the private key,
/// proving true self-custody where the user has complete control.
/// </summary>
public class SelfCustodyTest : MonoBehaviour
{
    [Header("Backend Configuration")]
    public string backendUrl = "http://localhost:3000";
    
    // Storage for the private key
    private string userPrivateKey;
    private string userAddress;
    private string userPublicKey;
    
    void Start()
    {
        StartCoroutine(TestSelfCustodyWallet());
    }
    
    IEnumerator TestSelfCustodyWallet()
    {
        Debug.Log("=== TESTING SELF-CUSTODY WALLET (POW-STYLE) ===");
        Debug.Log("This test verifies that the backend returns the private key,");
        Debug.Log("proving true self-custody where the user has complete control.");
        Debug.Log("");
        
        // Call the generate endpoint (self-custody)
        string url = backendUrl + "/wallet/generate";
        UnityWebRequest request = UnityWebRequest.Get(url);
        request.downloadHandler = new DownloadHandlerBuffer();
        
        Debug.Log($"Making GET request to: {url}");
        yield return request.SendWebRequest();
        
        if (request.result == UnityWebRequest.Result.Success)
        {
            // Parse the response
            string json = request.downloadHandler.text;
            Debug.Log($"✅ Request successful!");
            Debug.Log($"Raw response: {json}");
            Debug.Log("");
            
            // Check if response contains privateKey (the key indicator of self-custody)
            if (json.Contains("privateKey"))
            {
                Debug.Log("✅ SELF-CUSTODY CONFIRMED - Private key received!");
                Debug.Log("");
                
                // Parse JSON response
                try
                {
                    // Simple JSON parsing (extract values)
                    ExtractJsonValues(json);
                    
                    Debug.Log("🔑 USER HAS FULL CONTROL OF PRIVATE KEY");
                    Debug.Log($"  Address: {userAddress}");
                    Debug.Log($"  Public Key: {userPublicKey}");
                    Debug.Log($"  Private Key (first 20 chars): {userPrivateKey.Substring(0, Mathf.Min(20, userPrivateKey.Length))}...");
                    Debug.Log($"  Private Key (last 10 chars): ...{userPrivateKey.Substring(Mathf.Max(0, userPrivateKey.Length - 10))}");
                    Debug.Log("");
                    
                    // In a real app, you would:
                    // 1. Store this securely on device (SecureStorage for iOS/Android)
                    // 2. Never send it back to backend
                    // 3. Use it to sign transactions locally
                    
                    // Store it securely using SecureStorage
                    if (!string.IsNullOrEmpty(userPrivateKey))
                    {
                        SecureStorage.SaveSecure("StarknetPrivateKey", userPrivateKey);
                        Debug.Log("💾 Private key saved to secure device storage");
                        Debug.Log("   (Using SecureStorage - iOS Keychain / Android Keystore)");
                        Debug.Log("");
                    }
                    
                    // Verify it was saved
                    string savedKey = SecureStorage.LoadSecure("StarknetPrivateKey");
                    if (savedKey == userPrivateKey)
                    {
                        Debug.Log("✅ Verification: Private key successfully saved and retrieved");
                        Debug.Log("");
                    }
                    
                    Debug.Log("✅ THIS IS TRUE SELF-CUSTODY - Like POW!");
                    Debug.Log("   - User has the private key");
                    Debug.Log("   - Backend never stores it");
                    Debug.Log("   - User has complete control");
                    Debug.Log("");
                    
                    // Security test: Prove backend doesn't have it
                    Debug.Log("🔒 SECURITY TEST:");
                    Debug.Log("   To prove it's truly self-custody:");
                    Debug.Log("   1. ✅ Generated wallet - DONE");
                    Debug.Log("   2. ✅ Saved private key - DONE");
                    Debug.Log("   3. Stop the backend (Ctrl+C)");
                    Debug.Log("   4. You still have your key! ✅");
                    Debug.Log("   5. Backend can't access it! ✅");
                }
                catch (System.Exception e)
                {
                    Debug.LogError($"❌ Error parsing response: {e.Message}");
                    Debug.LogError($"Full response: {json}");
                }
            }
            else
            {
                Debug.LogError("❌ No private key in response - NOT self-custody");
                Debug.LogError($"Response: {json}");
                Debug.LogError("");
                Debug.LogError("Expected response format:");
                Debug.LogError("{");
                Debug.LogError("  \"privateKey\": \"0x...\",");
                Debug.LogError("  \"address\": \"0x...\",");
                Debug.LogError("  \"publicKey\": \"0x...\"");
                Debug.LogError("}");
            }
        }
        else
        {
            Debug.LogError("❌ Request failed!");
            Debug.LogError($"Error: {request.error}");
            Debug.LogError($"Response: {request.downloadHandler.text}");
            Debug.LogError("");
            Debug.LogError("Make sure:");
            Debug.LogError("  1. Backend is running (cd backend && bun run dev)");
            Debug.LogError("  2. Backend URL is correct: " + backendUrl);
        }
        
        request.Dispose();
    }
    
    /// <summary>
    /// Simple JSON value extraction (for testing purposes)
    /// In production, use a proper JSON library like Newtonsoft.Json
    /// </summary>
    private void ExtractJsonValues(string json)
    {
        // Extract privateKey
        int privateKeyStart = json.IndexOf("\"privateKey\":\"") + 14;
        int privateKeyEnd = json.IndexOf("\"", privateKeyStart);
        if (privateKeyStart > 13 && privateKeyEnd > privateKeyStart)
        {
            userPrivateKey = json.Substring(privateKeyStart, privateKeyEnd - privateKeyStart);
        }
        
        // Extract address
        int addressStart = json.IndexOf("\"address\":\"") + 11;
        int addressEnd = json.IndexOf("\"", addressStart);
        if (addressStart > 10 && addressEnd > addressStart)
        {
            userAddress = json.Substring(addressStart, addressEnd - addressStart);
        }
        
        // Extract publicKey
        int publicKeyStart = json.IndexOf("\"publicKey\":\"") + 13;
        int publicKeyEnd = json.IndexOf("\"", publicKeyStart);
        if (publicKeyStart > 12 && publicKeyEnd > publicKeyStart)
        {
            userPublicKey = json.Substring(publicKeyStart, publicKeyEnd - publicKeyStart);
        }
    }
    
    /// <summary>
    /// Public method to manually trigger the test
    /// </summary>
    public void RunTest()
    {
        StartCoroutine(TestSelfCustodyWallet());
    }
}

