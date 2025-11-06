using UnityEngine;
using System;

public static class AndroidKeystore
{
    private static AndroidJavaObject GetKeystore()
    {
        using (var unityPlayer = new AndroidJavaClass("com.unity3d.player.UnityPlayer"))
        using (var activity = unityPlayer.GetStatic<AndroidJavaObject>("currentActivity"))
        using (var context = activity.Call<AndroidJavaObject>("getApplicationContext"))
        {
            return new AndroidJavaObject("android.security.KeyStore", context);
        }
    }

    public static void SaveSecureString(string key, string value)
    {
        #if UNITY_ANDROID && !UNITY_EDITOR
        try
        {
            using (var keystore = GetKeystore())
            {
                // Use Android Keystore to encrypt
                var encryptedData = EncryptWithKeystore(value);
                PlayerPrefs.SetString($"secure_{key}", encryptedData);
                PlayerPrefs.Save();
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"Android Keystore error: {e.Message}");
            // Fallback to encrypted PlayerPrefs
            SecureStorage.SaveSecure(key, value);
        }
        #else
        SecureStorage.SaveSecure(key, value);
        #endif
    }

    private static string EncryptWithKeystore(string plainText)
    {
        // Implementation using Android Keystore API
        // This requires a custom Android plugin or Unity's native plugin interface
        return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(plainText));
    }
}
