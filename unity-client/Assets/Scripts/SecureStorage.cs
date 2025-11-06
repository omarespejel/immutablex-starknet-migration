using UnityEngine;
using System;
using System.Text;
using System.Security.Cryptography;

/// <summary>
/// Cross-platform secure storage wrapper for iOS Keychain and Android Keystore
/// Falls back to encrypted PlayerPrefs if native plugins are unavailable
/// </summary>
public static class SecureStorage
{
    private static readonly string ENCRYPTION_KEY = "YourEncryptionKey1234567890123456"; // 32 chars for AES-256

    /// <summary>
    /// Save a secure string value
    /// </summary>
    public static void SaveSecure(string key, string value)
    {
        #if UNITY_IOS && !UNITY_EDITOR
        iOSKeychain.SetString(key, value);
        #elif UNITY_ANDROID && !UNITY_EDITOR
        AndroidKeystore.SaveSecureString(key, value);
        #else
        // Fallback to encrypted PlayerPrefs for editor/testing
        string encrypted = Encrypt(value);
        PlayerPrefs.SetString($"secure_{key}", encrypted);
        PlayerPrefs.Save();
        #endif
    }

    /// <summary>
    /// Load a secure string value
    /// </summary>
    public static string LoadSecure(string key)
    {
        #if UNITY_IOS && !UNITY_EDITOR
        return iOSKeychain.GetString(key);
        #elif UNITY_ANDROID && !UNITY_EDITOR
        // Android implementation would read from keystore
        string encrypted = PlayerPrefs.GetString($"secure_{key}", "");
        return encrypted != "" ? Decrypt(encrypted) : "";
        #else
        // Fallback to encrypted PlayerPrefs for editor/testing
        string encrypted = PlayerPrefs.GetString($"secure_{key}", "");
        return encrypted != "" ? Decrypt(encrypted) : "";
        #endif
    }

    /// <summary>
    /// Delete a secure value
    /// </summary>
    public static void DeleteSecure(string key)
    {
        #if UNITY_IOS && !UNITY_EDITOR
        // iOS implementation would call delete function
        #endif
        
        PlayerPrefs.DeleteKey($"secure_{key}");
        PlayerPrefs.Save();
    }

    /// <summary>
    /// Simple AES encryption for fallback (editor/testing)
    /// </summary>
    private static string Encrypt(string plainText)
    {
        byte[] iv = new byte[16];
        using (Aes aes = Aes.Create())
        {
            aes.Key = Encoding.UTF8.GetBytes(ENCRYPTION_KEY);
            aes.IV = iv;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            ICryptoTransform encryptor = aes.CreateEncryptor(aes.Key, aes.IV);

            using (System.IO.MemoryStream msEncrypt = new System.IO.MemoryStream())
            {
                using (CryptoStream csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
                {
                    using (System.IO.StreamWriter swEncrypt = new System.IO.StreamWriter(csEncrypt))
                    {
                        swEncrypt.Write(plainText);
                    }
                }
                return Convert.ToBase64String(msEncrypt.ToArray());
            }
        }
    }

    /// <summary>
    /// Simple AES decryption for fallback (editor/testing)
    /// </summary>
    private static string Decrypt(string cipherText)
    {
        byte[] iv = new byte[16];
        byte[] buffer = Convert.FromBase64String(cipherText);

        using (Aes aes = Aes.Create())
        {
            aes.Key = Encoding.UTF8.GetBytes(ENCRYPTION_KEY);
            aes.IV = iv;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            ICryptoTransform decryptor = aes.CreateDecryptor(aes.Key, aes.IV);

            using (System.IO.MemoryStream msDecrypt = new System.IO.MemoryStream(buffer))
            {
                using (CryptoStream csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read))
                {
                    using (System.IO.StreamReader srDecrypt = new System.IO.StreamReader(csDecrypt))
                    {
                        return srDecrypt.ReadToEnd();
                    }
                }
            }
        }
    }
}
