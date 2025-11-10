# 🚀 Quick Start - Unity Backend Connection

**Your backend is running!** ✅  
**Now connect Unity in 3 steps:**

---

## ✅ Step 1: Verify Scripts Are Ready

The scripts are already configured with:
- ✅ Backend URL: `http://localhost:3000` (default)
- ✅ Auto-run tests option
- ✅ All endpoints ready

**No code changes needed!**

---

## 🎮 Step 2: Unity Editor Setup (2 minutes)

### In Unity Editor:

1. **Open your scene** (or create a new one)

2. **Create GameObject:**
   - Right-click in Hierarchy → **Create Empty**
   - Name it: `StarknetClient`

3. **Add Script:**
   - Select `StarknetClient` GameObject
   - In Inspector, click **"Add Component"**
   - Type: `TestStarknetIntegration`
   - Press Enter

4. **Verify Settings:**
   - In Inspector, you should see:
     ```
     Backend Url: http://localhost:3000  ✅
     ☑ Run Tests On Start  (check this)
     ```

---

## ▶️ Step 3: Press Play!

1. Click **Play** button ▶️
2. Open **Console** window (Window → General → Console)
3. Watch the tests run automatically!

**Expected Output:**
```
=== Starting Starknet Backend API Tests ===
[TEST 1] ✅ SUCCESS - Wallet generated!
[TEST 2] ✅ SUCCESS - Wallet created!
[TEST 3] ✅ SUCCESS - Session created!
[TEST 4] ✅ SUCCESS - Game action submitted!
```

---

## 🎯 That's It!

If you see ✅ SUCCESS messages, everything is working!

---

## 🐛 If Something Goes Wrong

### "Connection Refused"
- ✅ Make sure backend is running (`bun run dev` in terminal)
- ✅ Check Console shows: `🚀 Application is running on: http://localhost:3000`

### "Script Not Found"
- ✅ Make sure scripts are in `Assets/Scripts/` folder
- ✅ Unity may need to recompile - wait a moment

### No Console Output
- ✅ Open Console: Window → General → Console
- ✅ Check if "Run Tests On Start" is checked

---

## 📱 Testing on Mobile Device?

Change Backend URL in Inspector to:
```
http://YOUR_COMPUTER_IP:3000
```

Find your IP:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

---

**Need more details?** See `UNITY_SETUP_GUIDE.md`

