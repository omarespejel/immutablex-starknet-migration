using UnityEngine;
using UnityEngine.Networking;
using System.Collections;
using System.Text;
using System;

/// <summary>
/// Production-ready Unity client for Starknet backend API
/// Provides clean API methods for wallet, session, and game action management
/// </summary>
public class StarknetBackendClient : MonoBehaviour
{
    [Header("Configuration")]
    [SerializeField] private string backendUrl = "http://localhost:3000";
    [SerializeField] private float requestTimeout = 10f;
    
    // Events for UI updates
    public System.Action<WalletData> OnWalletGenerated;
    public System.Action<WalletData> OnWalletCreated;
    public System.Action<string> OnSessionCreated;
    public System.Action<GameActionResult> OnGameActionSubmitted;
    public System.Action<string> OnError;
    
    // Data models
    [System.Serializable]
    public class WalletData
    {
        public string privateKey;
        public string address;
        public string publicKey;
        public string encryptedPrivateKey;
        public string deploymentStatus;
    }
    
    [System.Serializable]
    public class GameActionResult
    {
        public string actionId;
        public string status;
        public int batchPosition;
    }
    
    private static StarknetBackendClient _instance;
    public static StarknetBackendClient Instance
    {
        get
        {
            if (_instance == null)
            {
                GameObject go = new GameObject("StarknetBackendClient");
                _instance = go.AddComponent<StarknetBackendClient>();
                DontDestroyOnLoad(go);
            }
            return _instance;
        }
    }
    
    void Awake()
    {
        if (_instance != null && _instance != this)
        {
            Destroy(gameObject);
            return;
        }
        _instance = this;
        DontDestroyOnLoad(gameObject);
    }
    
    /// <summary>
    /// Generate a new wallet (POW-style - returns private key for client storage)
    /// </summary>
    public void GenerateWallet(System.Action<WalletData> onSuccess = null, System.Action<string> onError = null)
    {
        StartCoroutine(GenerateWalletCoroutine(onSuccess, onError));
    }
    
    private IEnumerator GenerateWalletCoroutine(System.Action<WalletData> onSuccess, System.Action<string> onError)
    {
        string url = backendUrl + "/wallet/generate";
        UnityWebRequest request = UnityWebRequest.Get(url);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.timeout = (int)requestTimeout;
        
        yield return request.SendWebRequest();
        
        if (request.result == UnityWebRequest.Result.Success)
        {
            try
            {
                WalletData wallet = JsonUtility.FromJson<WalletData>(request.downloadHandler.text);
                onSuccess?.Invoke(wallet);
                OnWalletGenerated?.Invoke(wallet);
            }
            catch (Exception e)
            {
                string error = $"Failed to parse wallet response: {e.Message}";
                Debug.LogError(error);
                onError?.Invoke(error);
                OnError?.Invoke(error);
            }
        }
        else
        {
            string error = $"HTTP Error: {request.error}";
            Debug.LogError(error);
            onError?.Invoke(error);
            OnError?.Invoke(error);
        }
        
        request.Dispose();
    }
    
    /// <summary>
    /// Create a backend-managed wallet (encrypted storage on backend)
    /// </summary>
    public void CreateWallet(string userId, System.Action<WalletData> onSuccess = null, System.Action<string> onError = null)
    {
        StartCoroutine(CreateWalletCoroutine(userId, onSuccess, onError));
    }
    
    private IEnumerator CreateWalletCoroutine(string userId, System.Action<WalletData> onSuccess, System.Action<string> onError)
    {
        string url = backendUrl + "/wallet/create";
        string jsonData = $"{{\"userId\":\"{userId}\"}}";
        
        UnityWebRequest request = new UnityWebRequest(url, "POST");
        byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
        request.uploadHandler = new UploadHandlerRaw(bodyRaw);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");
        request.timeout = (int)requestTimeout;
        
        yield return request.SendWebRequest();
        
        if (request.result == UnityWebRequest.Result.Success)
        {
            try
            {
                WalletData wallet = JsonUtility.FromJson<WalletData>(request.downloadHandler.text);
                onSuccess?.Invoke(wallet);
                OnWalletCreated?.Invoke(wallet);
            }
            catch (Exception e)
            {
                string error = $"Failed to parse wallet response: {e.Message}";
                Debug.LogError(error);
                onError?.Invoke(error);
                OnError?.Invoke(error);
            }
        }
        else
        {
            string error = $"HTTP Error: {request.error}";
            Debug.LogError(error);
            onError?.Invoke(error);
            OnError?.Invoke(error);
        }
        
        request.Dispose();
    }
    
    /// <summary>
    /// Create a session with a wallet address
    /// </summary>
    public void CreateSession(string userId, string walletAddress, System.Action<string> onSuccess = null, System.Action<string> onError = null)
    {
        StartCoroutine(CreateSessionCoroutine(userId, walletAddress, onSuccess, onError));
    }
    
    private IEnumerator CreateSessionCoroutine(string userId, string walletAddress, System.Action<string> onSuccess, System.Action<string> onError)
    {
        string url = backendUrl + "/session/create";
        string jsonData = $"{{\"userId\":\"{userId}\",\"walletAddress\":\"{walletAddress}\"}}";
        
        UnityWebRequest request = new UnityWebRequest(url, "POST");
        byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
        request.uploadHandler = new UploadHandlerRaw(bodyRaw);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");
        request.timeout = (int)requestTimeout;
        
        yield return request.SendWebRequest();
        
        if (request.result == UnityWebRequest.Result.Success)
        {
            try
            {
                var response = JsonUtility.FromJson<SessionResponse>(request.downloadHandler.text);
                onSuccess?.Invoke(response.token);
                OnSessionCreated?.Invoke(response.token);
            }
            catch (Exception e)
            {
                string error = $"Failed to parse session response: {e.Message}";
                Debug.LogError(error);
                onError?.Invoke(error);
                OnError?.Invoke(error);
            }
        }
        else
        {
            string error = $"HTTP Error: {request.error}";
            Debug.LogError(error);
            onError?.Invoke(error);
            OnError?.Invoke(error);
        }
        
        request.Dispose();
    }
    
    /// <summary>
    /// Submit a game action
    /// </summary>
    public void SubmitGameAction(string sessionToken, string actionId, string method, System.Action<GameActionResult> onSuccess = null, System.Action<string> onError = null)
    {
        StartCoroutine(SubmitGameActionCoroutine(sessionToken, actionId, method, onSuccess, onError));
    }
    
    private IEnumerator SubmitGameActionCoroutine(string sessionToken, string actionId, string method, System.Action<GameActionResult> onSuccess, System.Action<string> onError)
    {
        string url = backendUrl + "/game/action";
        string jsonData = $@"{{
            ""sessionToken"": ""{sessionToken}"",
            ""action"": {{
                ""id"": ""{actionId}"",
                ""method"": ""{method}"",
                ""parameters"": {{}}
            }}
        }}";
        
        UnityWebRequest request = new UnityWebRequest(url, "POST");
        byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
        request.uploadHandler = new UploadHandlerRaw(bodyRaw);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");
        request.timeout = (int)requestTimeout;
        
        yield return request.SendWebRequest();
        
        if (request.result == UnityWebRequest.Result.Success)
        {
            try
            {
                GameActionResult result = JsonUtility.FromJson<GameActionResult>(request.downloadHandler.text);
                onSuccess?.Invoke(result);
                OnGameActionSubmitted?.Invoke(result);
            }
            catch (Exception e)
            {
                string error = $"Failed to parse game action response: {e.Message}";
                Debug.LogError(error);
                onError?.Invoke(error);
                OnError?.Invoke(error);
            }
        }
        else
        {
            string error = $"HTTP Error: {request.error}";
            Debug.LogError(error);
            onError?.Invoke(error);
            OnError?.Invoke(error);
        }
        
        request.Dispose();
    }
    
    [System.Serializable]
    private class SessionResponse
    {
        public string token;
    }
}

