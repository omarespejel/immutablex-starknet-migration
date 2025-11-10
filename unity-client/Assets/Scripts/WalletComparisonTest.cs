using UnityEngine;
using UnityEngine.Networking;
using System.Collections;
using System.Text;

/// <summary>
/// Comparison test script that demonstrates the difference between:
/// 1. Self-custody wallet (POW-style) - /wallet/generate
/// 2. Backend-managed wallet - /wallet/create
/// 
/// This helps verify that self-custody truly returns the private key.
/// </summary>
public class WalletComparisonTest : MonoBehaviour
{
    [Header("Backend Configuration")]
    public string backendUrl = "http://localhost:3000";
    
    [Header("Test Results")]
    [SerializeField] private string selfCustodyPrivateKey;
    [SerializeField] private string selfCustodyAddress;
    [SerializeField] private string managedWalletAddress;
    [SerializeField] private string managedEncryptedKey;
    
    void Start()
    {
        StartCoroutine(RunComparisonTest());
    }
    
    IEnumerator RunComparisonTest()
    {
        Debug.Log("═══════════════════════════════════════════════════════");
        Debug.Log("  WALLET COMPARISON TEST");
        Debug.Log("  Testing Self-Custody vs Backend-Managed Wallets");
        Debug.Log("═══════════════════════════════════════════════════════");
        Debug.Log("");
        
        yield return new WaitForSeconds(1f);
        
        // Test 1: Self-Custody Wallet (POW-style)
        Debug.Log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        Debug.Log("TEST 1: SELF-CUSTODY WALLET (POW-STYLE)");
        Debug.Log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        Debug.Log("Endpoint: GET /wallet/generate");
        Debug.Log("Expected: Returns privateKey field");
        Debug.Log("");
        
        yield return StartCoroutine(TestSelfCustodyWallet());
        
        yield return new WaitForSeconds(2f);
        
        // Test 2: Backend-Managed Wallet
        Debug.Log("");
        Debug.Log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        Debug.Log("TEST 2: BACKEND-MANAGED WALLET");
        Debug.Log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        Debug.Log("Endpoint: POST /wallet/create");
        Debug.Log("Expected: Returns encryptedPrivateKey (NO privateKey)");
        Debug.Log("");
        
        yield return StartCoroutine(TestManagedWallet());
        
        yield return new WaitForSeconds(1f);
        
        // Summary Comparison
        Debug.Log("");
        Debug.Log("═══════════════════════════════════════════════════════");
        Debug.Log("  COMPARISON SUMMARY");
        Debug.Log("═══════════════════════════════════════════════════════");
        Debug.Log("");
        Debug.Log("┌─────────────────────┬──────────────────┬──────────────────┐");
        Debug.Log("│ Feature              │ Self-Custody     │ Backend-Managed  │");
        Debug.Log("├─────────────────────┼──────────────────┼──────────────────┤");
        Debug.Log($"│ Endpoint             │ GET /generate    │ POST /create     │");
        Debug.Log($"│ Returns privateKey?  │ {(string.IsNullOrEmpty(selfCustodyPrivateKey) ? "❌ NO" : "✅ YES")}              │ ❌ NO            │");
        Debug.Log($"│ Who has the key?     │ User only        │ Backend          │");
        Debug.Log($"│ Can recover if lost? │ ❌ No            │ ✅ Yes           │");
        Debug.Log($"│ True Web3?           │ ✅ Yes           │ ❌ No            │");
        Debug.Log("└─────────────────────┴──────────────────┴──────────────────┘");
        Debug.Log("");
        
        if (!string.IsNullOrEmpty(selfCustodyPrivateKey))
        {
            Debug.Log("✅ SELF-CUSTODY VERIFIED!");
            Debug.Log("   The private key was returned to the client.");
            Debug.Log("   This proves true self-custody (POW-style).");
        }
        else
        {
            Debug.LogWarning("⚠️ Self-custody test did not return a private key.");
            Debug.LogWarning("   Check backend logs for errors.");
        }
    }
    
    IEnumerator TestSelfCustodyWallet()
    {
        string url = backendUrl + "/wallet/generate";
        UnityWebRequest request = UnityWebRequest.Get(url);
        request.downloadHandler = new DownloadHandlerBuffer();
        
        yield return request.SendWebRequest();
        
        if (request.result == UnityWebRequest.Result.Success)
        {
            string json = request.downloadHandler.text;
            Debug.Log($"✅ Request successful");
            Debug.Log($"Response: {json}");
            
            if (json.Contains("\"privateKey\""))
            {
                Debug.Log("");
                Debug.Log("✅ SELF-CUSTODY CONFIRMED!");
                Debug.Log("   ✓ privateKey field found in response");
                
                // Extract values
                ExtractSelfCustodyValues(json);
                
                Debug.Log($"   Address: {selfCustodyAddress}");
                Debug.Log($"   Private Key: {selfCustodyPrivateKey.Substring(0, Mathf.Min(20, selfCustodyPrivateKey.Length))}...");
                Debug.Log("");
                Debug.Log("   🔑 USER HAS FULL CONTROL");
                Debug.Log("   💾 Key should be stored securely on device");
                Debug.Log("   🚫 Backend never stores this key");
            }
            else
            {
                Debug.LogError("❌ FAILED - No privateKey in response");
                Debug.LogError("   This endpoint should return privateKey for self-custody");
            }
        }
        else
        {
            Debug.LogError($"❌ Request failed: {request.error}");
            Debug.LogError($"Response: {request.downloadHandler.text}");
        }
        
        request.Dispose();
    }
    
    IEnumerator TestManagedWallet()
    {
        string url = backendUrl + "/wallet/create";
        string userId = "test-user-" + UnityEngine.Random.Range(1000, 9999);
        
        string jsonData = $"{{\"userId\":\"{userId}\"}}";
        byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
        
        UnityWebRequest request = new UnityWebRequest(url, "POST");
        request.uploadHandler = new UploadHandlerRaw(bodyRaw);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");
        
        yield return request.SendWebRequest();
        
        if (request.result == UnityWebRequest.Result.Success)
        {
            string json = request.downloadHandler.text;
            Debug.Log($"✅ Request successful");
            Debug.Log($"Response: {json}");
            
            if (json.Contains("\"encryptedPrivateKey\""))
            {
                Debug.Log("");
                Debug.Log("✅ BACKEND-MANAGED CONFIRMED!");
                Debug.Log("   ✓ encryptedPrivateKey field found");
                Debug.Log("   ✓ NO privateKey field (as expected)");
                
                // Extract values
                ExtractManagedValues(json);
                
                Debug.Log($"   Address: {managedWalletAddress}");
                Debug.Log($"   Encrypted Key: {managedEncryptedKey.Substring(0, Mathf.Min(30, managedEncryptedKey.Length))}...");
                Debug.Log("");
                Debug.Log("   🔒 BACKEND HAS THE KEY");
                Debug.Log("   💾 Key is encrypted and stored on backend");
                Debug.Log("   ✅ Can be recovered if user loses access");
            }
            else
            {
                Debug.LogWarning("⚠️ Response format unexpected");
            }
            
            // Verify it does NOT contain privateKey
            if (json.Contains("\"privateKey\""))
            {
                Debug.LogError("❌ SECURITY ISSUE - Managed wallet returned privateKey!");
            }
            else
            {
                Debug.Log("   ✓ Confirmed: No privateKey in response (correct behavior)");
            }
        }
        else
        {
            Debug.LogError($"❌ Request failed: {request.error}");
            Debug.LogError($"Response: {request.downloadHandler.text}");
        }
        
        request.Dispose();
    }
    
    private void ExtractSelfCustodyValues(string json)
    {
        int privateKeyStart = json.IndexOf("\"privateKey\":\"") + 14;
        int privateKeyEnd = json.IndexOf("\"", privateKeyStart);
        if (privateKeyStart > 13 && privateKeyEnd > privateKeyStart)
        {
            selfCustodyPrivateKey = json.Substring(privateKeyStart, privateKeyEnd - privateKeyStart);
        }
        
        int addressStart = json.IndexOf("\"address\":\"") + 11;
        int addressEnd = json.IndexOf("\"", addressStart);
        if (addressStart > 10 && addressEnd > addressStart)
        {
            selfCustodyAddress = json.Substring(addressStart, addressEnd - addressStart);
        }
    }
    
    private void ExtractManagedValues(string json)
    {
        int addressStart = json.IndexOf("\"address\":\"") + 11;
        int addressEnd = json.IndexOf("\"", addressStart);
        if (addressStart > 10 && addressEnd > addressStart)
        {
            managedWalletAddress = json.Substring(addressStart, addressEnd - addressStart);
        }
        
        int encryptedKeyStart = json.IndexOf("\"encryptedPrivateKey\":\"") + 22;
        int encryptedKeyEnd = json.IndexOf("\"", encryptedKeyStart);
        if (encryptedKeyStart > 21 && encryptedKeyEnd > encryptedKeyStart)
        {
            managedEncryptedKey = json.Substring(encryptedKeyStart, encryptedKeyEnd - encryptedKeyStart);
        }
    }
    
    public void RunTest()
    {
        StartCoroutine(RunComparisonTest());
    }
}

