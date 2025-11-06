using System.Runtime.InteropServices;
using UnityEngine;

public static class iOSKeychain
{
    #if UNITY_IOS && !UNITY_EDITOR
    [DllImport("__Internal")]
    private static extern void _SaveToKeychain(string key, string value);

    [DllImport("__Internal")]
    private static extern string _LoadFromKeychain(string key);

    [DllImport("__Internal")]
    private static extern void _DeleteFromKeychain(string key);
    #endif

    public static void SetString(string key, string value)
    {
        #if UNITY_IOS && !UNITY_EDITOR
        _SaveToKeychain(key, value);
        #else
        SecureStorage.SaveSecure(key, value);
        #endif
    }

    public static string GetString(string key)
    {
        #if UNITY_IOS && !UNITY_EDITOR
        return _LoadFromKeychain(key);
        #else
        return SecureStorage.LoadSecure(key);
        #endif
    }
}
