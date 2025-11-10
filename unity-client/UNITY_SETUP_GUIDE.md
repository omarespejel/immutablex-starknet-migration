# Unity Setup Guide - Backend Configuration

**Quick guide to configure Unity client to connect to your backend**

---

## ✅ Backend Status

Your backend is running successfully! ✅
```
🚀 Application is running on: http://localhost:3000
✅ All modules loaded successfully
```

---

## 🎮 Unity Configuration Steps

### Option 1: Using Test Script (Recommended for Testing)

1. **Open Unity Editor**
   - Open your Unity project
   - Navigate to the scene where you want to test

2. **Create/Select GameObject**
   - In Hierarchy, right-click → Create Empty
   - Name it: `StarknetTestClient`

3. **Add Test Script**
   - Select the `StarknetTestClient` GameObject
   - In Inspector, click "Add Component"
   - Search for: `TestStarknetIntegration`
   - Click to add

4. **Configure Backend URL**
   - In Inspector, find the **"Backend Configuration"** section
   - Set **Backend Url** to: `http://localhost:3000`
   - ✅ Check **"Run Tests On Start"** (optional - runs tests automatically)
   - Set **Delay Between Tests** to: `1` (seconds)

5. **Press Play**
   - Click the Play button ▶️
   - Check Console window for test results

**Expected Console Output:**
```
=== Starting Starknet Backend API Tests ===
[TEST 1] Testing wallet generation endpoint...
[TEST 1] ✅ SUCCESS - Wallet generated!
  Address: 0x...
...
```

---

### Option 2: Using Production Client (For Your Game)

1. **Add Production Client Script**
   - Select a GameObject (or create one)
   - Add Component → `StarknetBackendClient`

2. **Configure Settings**
   - **Backend Url:** `http://localhost:3000`
   - **Request Timeout:** `10` (seconds)

3. **Use in Code**
   ```csharp
   var client = StarknetBackendClient.Instance;
   
   client.GenerateWallet(
       onSuccess: (wallet) => {
           Debug.Log($"Wallet: {wallet.address}");
       }
   );
   ```

---

## 📸 Visual Guide

### Inspector View (TestStarknetIntegration)

```
┌─────────────────────────────────────┐
│ TestStarknet Integration (Script)  │
├─────────────────────────────────────┤
│ Backend Configuration              │
│ ┌───────────────────────────────┐ │
│ │ Backend Url                    │ │
│ │ http://localhost:3000          │ │ ← SET THIS
│ └───────────────────────────────┘ │
│                                    │
│ Test Settings                      │
│ ┌───────────────────────────────┐ │
│ │ ☑ Run Tests On Start         │ │ ← CHECK THIS
│ │ Delay Between Tests: 1        │ │
│ └───────────────────────────────┘ │
│                                    │
│ Test Results                       │
│ ┌───────────────────────────────┐ │
│ │ Last Generated Wallet Address │ │
│ │ (empty until tests run)       │ │
│ └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🔍 Verification Steps

### Step 1: Check Backend is Running

In your terminal, you should see:
```
🚀 Application is running on: http://localhost:3000
✅ All modules loaded successfully
```

### Step 2: Test Backend from Terminal (Optional)

```bash
curl -X GET http://localhost:3000/wallet/generate
```

Should return JSON with wallet data.

### Step 3: Run Unity Tests

1. Press Play in Unity
2. Open Console window (Window → General → Console)
3. Look for test results

---

## 📱 For Mobile Device Testing

If testing on iOS/Android device:

### Step 1: Find Your Computer's IP Address

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig | findstr IPv4
```

Example output: `inet 192.168.1.100`

### Step 2: Update Unity Backend URL

Change from:
```
http://localhost:3000
```

To:
```
http://192.168.1.100:3000
```
(Replace with your actual IP)

### Step 3: Ensure Same Network

- ✅ Device and computer on same Wi-Fi network
- ✅ Firewall allows port 3000
- ✅ Backend CORS is configured (already set to `*`)

---

## 🐛 Troubleshooting

### Issue: "Connection Refused" in Unity

**Symptoms:**
```
HTTP Error: Cannot connect to destination host
```

**Solutions:**
1. ✅ Verify backend is running (`bun run dev`)
2. ✅ Check backend URL is correct (`http://localhost:3000`)
3. ✅ For device testing, use IP address not `localhost`
4. ✅ Check firewall settings

### Issue: Tests Don't Run Automatically

**Solution:**
- Make sure "Run Tests On Start" is checked in Inspector
- Or manually call `GetComponent<TestStarknetIntegration>().RunTests()`

### Issue: No Console Output

**Solution:**
- Open Console window: Window → General → Console
- Check if errors are filtered (toggle error/warning buttons)

---

## ✅ Quick Checklist

- [ ] Backend running (`bun run dev`)
- [ ] Backend URL set in Unity Inspector: `http://localhost:3000`
- [ ] Test script added to GameObject
- [ ] "Run Tests On Start" checked (optional)
- [ ] Console window open to see results
- [ ] Press Play ▶️

---

## 🎯 Next Steps

Once configured:

1. **Test All Endpoints:**
   - Wallet generation ✅
   - Wallet creation ✅
   - Session creation ✅
   - Game actions ✅

2. **Integrate into Your Game:**
   - Use `StarknetBackendClient` in your game scripts
   - Handle events for UI updates
   - Store private keys securely with `SecureStorage`

3. **Production Setup:**
   - Change backend URL to production server
   - Remove test scripts
   - Add proper error handling UI

---

**Need Help?** Check:
- `unity-client/README.md` - Detailed Unity documentation
- `UNITY_CLIENT_STATUS.md` - Client verification status
- `API_ENDPOINT_TESTING.md` - Backend API documentation

---

**Last Updated:** November 9, 2025

