using UnityEngine;
using UnityEngine.Networking;
using System.Collections;
using System.Text;

/// <summary>
/// Load test script for transaction batching system.
/// Sends multiple actions to trigger batch submission at 100 actions.
/// </summary>
public class LoadTestBatching : MonoBehaviour
{
    [Header("Backend Configuration")]
    public string backendUrl = "http://localhost:3000";
    
    [Header("Test Settings")]
    public int actionsToSend = 105; // Triggers batch at 100
    
    private string sessionToken;
    private string walletAddress;
    private int actionsSent = 0;
    private int actionsSucceeded = 0;
    private int actionsFailed = 0;
    
    [System.Serializable]
    public class ActionResponse
    {
        public string actionId;
        public string status;
        public int batchPosition;
    }
    
    void Start()
    {
        StartCoroutine(RunLoadTest());
    }
    
    IEnumerator RunLoadTest()
    {
        Debug.Log("═══════════════════════════════════════════════════════");
        Debug.Log("  TRANSACTION BATCHING LOAD TEST");
        Debug.Log("═══════════════════════════════════════════════════════");
        Debug.Log("");
        
        // Setup wallet and session
        yield return StartCoroutine(SetupSession());
        
        if (string.IsNullOrEmpty(sessionToken))
        {
            Debug.LogError("❌ Failed to setup session. Aborting test.");
            yield break;
        }
        
        Debug.Log("");
        Debug.Log($"📤 Sending {actionsToSend} actions...");
        Debug.Log("   (Batch triggers at 100 actions)");
        Debug.Log("");
        
        // Send many actions quickly
        for (int i = 0; i < actionsToSend; i++)
        {
            StartCoroutine(SendAction(i));
            
            if (i == 99)
            {
                Debug.Log("");
                Debug.Log("🎯 BATCH TRIGGER - First 100 actions will submit!");
                Debug.Log("");
            }
            
            // Small delay to avoid overwhelming the server
            if (i % 10 == 0 && i > 0)
            {
                yield return new WaitForSeconds(0.1f);
            }
        }
        
        // Wait for all actions to complete
        yield return new WaitForSeconds(2f);
        
        Debug.Log("");
        Debug.Log("═══════════════════════════════════════════════════════");
        Debug.Log("  TEST SUMMARY");
        Debug.Log("═══════════════════════════════════════════════════════");
        Debug.Log($"Actions sent: {actionsSent}");
        Debug.Log($"Actions succeeded: {actionsSucceeded}");
        Debug.Log($"Actions failed: {actionsFailed}");
        Debug.Log("");
        Debug.Log("📊 Check backend logs for batch submission");
        Debug.Log("   Look for: [TransactionBatchProcessor] BATCH: Submitting batch");
    }
    
    IEnumerator SetupSession()
    {
        Debug.Log("Setting up wallet and session...");
        
        // Generate wallet
        string walletUrl = backendUrl + "/wallet/generate";
        UnityWebRequest walletRequest = UnityWebRequest.Get(walletUrl);
        yield return walletRequest.SendWebRequest();
        
        if (walletRequest.result != UnityWebRequest.Result.Success)
        {
            Debug.LogError($"❌ Wallet generation failed: {walletRequest.error}");
            yield break;
        }
        
        string walletJson = walletRequest.downloadHandler.text;
        // Simple JSON parsing
        int addressStart = walletJson.IndexOf("\"address\":\"") + 11;
        int addressEnd = walletJson.IndexOf("\"", addressStart);
        walletAddress = walletJson.Substring(addressStart, addressEnd - addressStart);
        
        Debug.Log($"✅ Wallet created: {walletAddress}");
        walletRequest.Dispose();
        
        // Create session
        string sessionUrl = backendUrl + "/session/create";
        string sessionJson = $"{{\"userId\":\"load-test-user\",\"walletAddress\":\"{walletAddress}\"}}";
        byte[] bodyRaw = Encoding.UTF8.GetBytes(sessionJson);
        
        UnityWebRequest sessionRequest = new UnityWebRequest(sessionUrl, "POST");
        sessionRequest.uploadHandler = new UploadHandlerRaw(bodyRaw);
        sessionRequest.downloadHandler = new DownloadHandlerBuffer();
        sessionRequest.SetRequestHeader("Content-Type", "application/json");
        
        yield return sessionRequest.SendWebRequest();
        
        if (sessionRequest.result != UnityWebRequest.Result.Success)
        {
            Debug.LogError($"❌ Session creation failed: {sessionRequest.error}");
            yield break;
        }
        
        string sessionResponse = sessionRequest.downloadHandler.text;
        int tokenStart = sessionResponse.IndexOf("\"token\":\"") + 9;
        int tokenEnd = sessionResponse.IndexOf("\"", tokenStart);
        sessionToken = sessionResponse.Substring(tokenStart, tokenEnd - tokenStart);
        
        Debug.Log("✅ Session created");
        sessionRequest.Dispose();
    }
    
    IEnumerator SendAction(int index)
    {
        actionsSent++;
        
        string actionJson = $@"{{
            ""sessionToken"": ""{sessionToken}"",
            ""action"": {{
                ""id"": ""action-{index}"",
                ""method"": ""game_action"",
                ""parameters"": {{ ""score"": {index * 100} }}
            }}
        }}";
        
        byte[] bodyRaw = Encoding.UTF8.GetBytes(actionJson);
        
        UnityWebRequest request = new UnityWebRequest(backendUrl + "/game/action", "POST");
        request.uploadHandler = new UploadHandlerRaw(bodyRaw);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");
        
        yield return request.SendWebRequest();
        
        if (request.result == UnityWebRequest.Result.Success)
        {
            actionsSucceeded++;
            try
            {
                string responseText = request.downloadHandler.text;
                ActionResponse response = JsonUtility.FromJson<ActionResponse>(responseText);
                
                if (index % 20 == 0)
                {
                    Debug.Log($"Action {index}: Batch position {response.batchPosition}");
                }
            }
            catch
            {
                // Ignore JSON parse errors for logging
            }
        }
        else
        {
            actionsFailed++;
            if (index % 20 == 0)
            {
                Debug.LogWarning($"Action {index} failed: {request.error}");
            }
        }
        
        request.Dispose();
    }
    
    /// <summary>
    /// Public method to manually trigger the test
    /// </summary>
    public void RunTest()
    {
        StartCoroutine(RunLoadTest());
    }
}

