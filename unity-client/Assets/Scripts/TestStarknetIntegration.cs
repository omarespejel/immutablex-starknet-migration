using UnityEngine;
using UnityEngine.Networking;
using System.Collections;
using System.Text;
using System;

/// <summary>
/// Unity test client for Starknet backend API integration
/// Tests all endpoints: wallet generation, wallet creation, session creation, and game actions
/// </summary>
public class TestStarknetIntegration : MonoBehaviour
{
    [Header("Backend Configuration")]
    [SerializeField] private string backendUrl = "http://localhost:3000";
    
    [Header("Test Settings")]
    [SerializeField] private bool runTestsOnStart = true;
    [SerializeField] private float delayBetweenTests = 1f;
    
    [Header("Test Results")]
    [SerializeField] private string lastGeneratedWalletAddress;
    [SerializeField] private string lastSessionToken;
    [SerializeField] private string lastError;
    
    // Test data models
    [System.Serializable]
    public class WalletGenerateResponse
    {
        public string privateKey;
        public string address;
        public string publicKey;
    }
    
    [System.Serializable]
    public class WalletCreateRequest
    {
        public string userId;
    }
    
    [System.Serializable]
    public class WalletCreateResponse
    {
        public string address;
        public string publicKey;
        public string encryptedPrivateKey;
        public string deploymentStatus;
    }
    
    [System.Serializable]
    public class SessionCreateRequest
    {
        public string userId;
        public string walletAddress;
    }
    
    [System.Serializable]
    public class SessionCreateResponse
    {
        public string token;
    }
    
    [System.Serializable]
    public class GameActionRequest
    {
        public string sessionToken;
        public GameAction action;
    }
    
    [System.Serializable]
    public class GameAction
    {
        public string id;
        public string method;
        public object parameters;
    }
    
    [System.Serializable]
    public class GameActionResponse
    {
        public string actionId;
        public string status;
        public int batchPosition;
    }
    
    void Start()
    {
        if (runTestsOnStart)
        {
            StartCoroutine(RunAllTests());
        }
    }
    
    /// <summary>
    /// Run all API tests in sequence
    /// </summary>
    public IEnumerator RunAllTests()
    {
        Debug.Log("=== Starting Starknet Backend API Tests ===");
        
        yield return new WaitForSeconds(0.5f);
        
        // Test 1: Wallet Generation
        yield return StartCoroutine(TestWalletGeneration());
        yield return new WaitForSeconds(delayBetweenTests);
        
        // Test 2: Wallet Creation
        yield return StartCoroutine(TestWalletCreation("test-user-unity-" + UnityEngine.Random.Range(1000, 9999)));
        yield return new WaitForSeconds(delayBetweenTests);
        
        // Test 3: Session Creation (requires wallet address)
        if (!string.IsNullOrEmpty(lastGeneratedWalletAddress))
        {
            yield return StartCoroutine(TestSessionCreation("test-user-unity", lastGeneratedWalletAddress));
            yield return new WaitForSeconds(delayBetweenTests);
            
            // Test 4: Game Action (requires session token)
            if (!string.IsNullOrEmpty(lastSessionToken))
            {
                yield return StartCoroutine(TestGameAction(lastSessionToken));
            }
            else
            {
                Debug.LogWarning("Skipping game action test - no session token available");
            }
        }
        else
        {
            Debug.LogWarning("Skipping session and game action tests - no wallet address available");
        }
        
        Debug.Log("=== All Tests Completed ===");
    }
    
    /// <summary>
    /// Test 1: Generate a new wallet (POW-style, returns private key)
    /// </summary>
    public IEnumerator TestWalletGeneration()
    {
        Debug.Log("[TEST 1] Testing wallet generation endpoint...");
        
        string url = backendUrl + "/wallet/generate";
        UnityWebRequest request = UnityWebRequest.Get(url);
        request.downloadHandler = new DownloadHandlerBuffer();
        
        yield return request.SendWebRequest();
        
        if (request.result == UnityWebRequest.Result.Success)
        {
            try
            {
                string jsonResponse = request.downloadHandler.text;
                WalletGenerateResponse wallet = JsonUtility.FromJson<WalletGenerateResponse>(jsonResponse);
                
                Debug.Log($"[TEST 1] ✅ SUCCESS - Wallet generated!");
                Debug.Log($"  Address: {wallet.address}");
                Debug.Log($"  Public Key: {wallet.publicKey}");
                Debug.Log($"  Private Key: {wallet.privateKey.Substring(0, 20)}...");
                
                // Store for later tests
                lastGeneratedWalletAddress = wallet.address;
                
                // Optionally save private key securely
                if (!string.IsNullOrEmpty(wallet.privateKey))
                {
                    SecureStorage.SaveSecure("starknet_private_key", wallet.privateKey);
                    Debug.Log("  Private key saved securely");
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[TEST 1] ❌ FAILED - JSON parsing error: {e.Message}");
                Debug.LogError($"Response: {request.downloadHandler.text}");
                lastError = e.Message;
            }
        }
        else
        {
            Debug.LogError($"[TEST 1] ❌ FAILED - HTTP Error: {request.error}");
            Debug.LogError($"Response: {request.downloadHandler.text}");
            lastError = request.error;
        }
        
        request.Dispose();
    }
    
    /// <summary>
    /// Test 2: Create a backend-managed wallet
    /// </summary>
    public IEnumerator TestWalletCreation(string userId)
    {
        Debug.Log($"[TEST 2] Testing wallet creation endpoint for user: {userId}...");
        
        string url = backendUrl + "/wallet/create";
        WalletCreateRequest requestData = new WalletCreateRequest { userId = userId };
        string jsonData = JsonUtility.ToJson(requestData);
        
        UnityWebRequest request = new UnityWebRequest(url, "POST");
        byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
        request.uploadHandler = new UploadHandlerRaw(bodyRaw);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");
        
        yield return request.SendWebRequest();
        
        if (request.result == UnityWebRequest.Result.Success)
        {
            try
            {
                string jsonResponse = request.downloadHandler.text;
                WalletCreateResponse wallet = JsonUtility.FromJson<WalletCreateResponse>(jsonResponse);
                
                Debug.Log($"[TEST 2] ✅ SUCCESS - Wallet created!");
                Debug.Log($"  Address: {wallet.address}");
                Debug.Log($"  Public Key: {wallet.publicKey}");
                Debug.Log($"  Deployment Status: {wallet.deploymentStatus}");
                Debug.Log($"  Encrypted Key: {wallet.encryptedPrivateKey.Substring(0, 30)}...");
                
                // Store for later tests if we don't have one yet
                if (string.IsNullOrEmpty(lastGeneratedWalletAddress))
                {
                    lastGeneratedWalletAddress = wallet.address;
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[TEST 2] ❌ FAILED - JSON parsing error: {e.Message}");
                Debug.LogError($"Response: {request.downloadHandler.text}");
                lastError = e.Message;
            }
        }
        else
        {
            Debug.LogError($"[TEST 2] ❌ FAILED - HTTP Error: {request.error}");
            Debug.LogError($"Response: {request.downloadHandler.text}");
            lastError = request.error;
        }
        
        request.Dispose();
    }
    
    /// <summary>
    /// Test 3: Create a session with a wallet address
    /// </summary>
    public IEnumerator TestSessionCreation(string userId, string walletAddress)
    {
        Debug.Log($"[TEST 3] Testing session creation endpoint...");
        Debug.Log($"  User ID: {userId}");
        Debug.Log($"  Wallet Address: {walletAddress}");
        
        string url = backendUrl + "/session/create";
        SessionCreateRequest requestData = new SessionCreateRequest 
        { 
            userId = userId,
            walletAddress = walletAddress
        };
        string jsonData = JsonUtility.ToJson(requestData);
        
        UnityWebRequest request = new UnityWebRequest(url, "POST");
        byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
        request.uploadHandler = new UploadHandlerRaw(bodyRaw);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");
        
        yield return request.SendWebRequest();
        
        if (request.result == UnityWebRequest.Result.Success)
        {
            try
            {
                string jsonResponse = request.downloadHandler.text;
                SessionCreateResponse session = JsonUtility.FromJson<SessionCreateResponse>(jsonResponse);
                
                Debug.Log($"[TEST 3] ✅ SUCCESS - Session created!");
                Debug.Log($"  Token: {session.token.Substring(0, 50)}...");
                
                // Store for game action test
                lastSessionToken = session.token;
            }
            catch (Exception e)
            {
                Debug.LogError($"[TEST 3] ❌ FAILED - JSON parsing error: {e.Message}");
                Debug.LogError($"Response: {request.downloadHandler.text}");
                lastError = e.Message;
            }
        }
        else
        {
            Debug.LogError($"[TEST 3] ❌ FAILED - HTTP Error: {request.error}");
            Debug.LogError($"Response: {request.downloadHandler.text}");
            lastError = request.error;
        }
        
        request.Dispose();
    }
    
    /// <summary>
    /// Test 4: Submit a game action
    /// </summary>
    public IEnumerator TestGameAction(string sessionToken)
    {
        Debug.Log($"[TEST 4] Testing game action endpoint...");
        
        string url = backendUrl + "/game/action";
        GameActionRequest requestData = new GameActionRequest
        {
            sessionToken = sessionToken,
            action = new GameAction
            {
                id = "test-action-" + UnityEngine.Random.Range(1000, 9999),
                method = "game_action",
                parameters = new { test = true, timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds() }
            }
        };
        
        // Unity's JsonUtility doesn't handle nested objects well, so we'll build JSON manually
        string jsonData = $@"{{
            ""sessionToken"": ""{sessionToken}"",
            ""action"": {{
                ""id"": ""{requestData.action.id}"",
                ""method"": ""{requestData.action.method}"",
                ""parameters"": {{}}
            }}
        }}";
        
        UnityWebRequest request = new UnityWebRequest(url, "POST");
        byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
        request.uploadHandler = new UploadHandlerRaw(bodyRaw);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");
        
        yield return request.SendWebRequest();
        
        if (request.result == UnityWebRequest.Result.Success)
        {
            try
            {
                string jsonResponse = request.downloadHandler.text;
                GameActionResponse response = JsonUtility.FromJson<GameActionResponse>(jsonResponse);
                
                Debug.Log($"[TEST 4] ✅ SUCCESS - Game action submitted!");
                Debug.Log($"  Action ID: {response.actionId}");
                Debug.Log($"  Status: {response.status}");
                Debug.Log($"  Batch Position: {response.batchPosition}");
            }
            catch (Exception e)
            {
                Debug.LogError($"[TEST 4] ❌ FAILED - JSON parsing error: {e.Message}");
                Debug.LogError($"Response: {request.downloadHandler.text}");
                lastError = e.Message;
            }
        }
        else
        {
            Debug.LogError($"[TEST 4] ❌ FAILED - HTTP Error: {request.error}");
            Debug.LogError($"Response: {request.downloadHandler.text}");
            lastError = request.error;
        }
        
        request.Dispose();
    }
    
    /// <summary>
    /// Public method to manually trigger tests from UI or other scripts
    /// </summary>
    public void RunTests()
    {
        StartCoroutine(RunAllTests());
    }
    
    /// <summary>
    /// Test individual endpoints manually
    /// </summary>
    public void TestWalletGenerate()
    {
        StartCoroutine(TestWalletGeneration());
    }
    
    public void TestWalletCreate(string userId)
    {
        StartCoroutine(TestWalletCreation(userId));
    }
    
    public void TestSessionCreate(string userId, string walletAddress)
    {
        StartCoroutine(TestSessionCreation(userId, walletAddress));
    }
    
    public void TestGameActionSubmit(string sessionToken)
    {
        StartCoroutine(TestGameAction(sessionToken));
    }
}

