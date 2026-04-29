# NGrok Setup & M-Pesa Integration Guide

## 📡 NGrok Installation & Setup

### 1. Install NGrok

**Option A: Download (Recommended)**
- Go to https://ngrok.com/download
- Download for Windows
- Extract to a folder (e.g., `C:\ngrok`)
- Add to PATH or use full path

**Option B: Chocolatey**
```powershell
choco install ngrok
```

**Option C: Verify Installation**
```powershell
ngrok --version
```

---

## 🚀 Running NGrok

### Step 1: Open New Terminal (Keep separate from backend)
```powershell
# Terminal 1: Backend Server
cd "c:\Users\USER\OneDrive\Desktop\AGROMART WEB\farm website\BACKEND"
npm run dev

# Terminal 2: NGrok Tunnel (NEW - open separate terminal)
ngrok http 3000
```

### Step 2: Copy NGrok URL
You'll see output like:
```
Forwarding                    https://1234-56-789-000-12.ngrok-free.app -> http://localhost:3000
```

**Copy the HTTPS URL** (always use HTTPS for security)

### Step 3: Update .env File
Replace `your-ngrok-url.ngrok-free.app` with your actual ngrok URL:

```env
MPESA_CALLBACK_URL=https://1234-56-789-000-12.ngrok-free.app/api/payments/callback
MPESA_TIMEOUT_URL=https://1234-56-789-000-12.ngrok-free.app/api/payments/timeout
```

### Step 4: Restart Backend
```powershell
# Terminal 1: Stop current backend (Ctrl+C)
# Then restart
npm run dev
```

---

## 🔐 Get M-Pesa Sandbox Credentials

### Visit Safaricom Developer Portal
1. Go to: https://developer.safaricom.co.ke/
2. Sign up / Log in with your account
3. Create a new app in the Sandbox environment

### Get Your Credentials
The portal will provide:
- **Consumer Key** - Copy this
- **Consumer Secret** - Copy this

### Update .env with Your Credentials
```env
MPESA_CONSUMER_KEY=your_actual_consumer_key_here
MPESA_CONSUMER_SECRET=your_actual_consumer_secret_here
```

### Find Your Shortcode & Passkey
Default sandbox values (usually work as-is):
```env
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd1a503f6fd4e30cc1f1dacd39f14b5adfb3e82e8d
```

---

## ✅ Test Your Setup

### Test 1: Backend Health Check
```powershell
curl https://your-ngrok-url.ngrok-free.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-20T...",
  "environment": "development"
}
```

### Test 2: Access Products via NGrok
```powershell
curl https://your-ngrok-url.ngrok-free.app/api/products
```

### Test 3: Test STK Push Payment
```powershell
# Create a test order first, then trigger payment
curl -X POST https://your-ngrok-url.ngrok-free.app/api/payments/initiate-stk `
  -H "Content-Type: application/json" `
  -d '{
    "orderId": "test-order-123",
    "phoneNumber": "+254712345678",
    "amount": 100,
    "userId": "user-123"
  }'
```

---

## 📊 NGrok Monitoring & Debugging

### View NGrok Web Inspector
- Local: http://localhost:4040
- Shows all requests/responses in real-time
- PerfectForDebugging API calls

### Key Things to Monitor
✅ Callback requests from M-Pesa
✅ Response codes (200 = success)
✅ Request/response bodies
✅ Timestamps

---

## ⚠️ Important Notes

### NGrok URL Changes
- **Free tier**: URL changes every session restart
- **Pro account**: Can get static URLs
- Update `.env` each time ngrok restarts (if using free)

### Security
- ✅ Always use HTTPS (not HTTP)
- ✅ Keep Consumer Key/Secret private
- ✅ Don't commit .env to git
- ✅ Rotate passkeys periodically

### M-Pesa Test Phone Numbers
Sandbox test numbers:
- `254712345678` (without +)
- `0712345678` (with leading 0)
- Both formats supported

### Logs to Watch
Backend console should show:
```
📱 Processing STK Push for 254712345678, Amount: 100, Order: test-order-123
📤 Sending STK Push request...
✅ STK Push Response: {...}
```

---

## 🔄 Complete Workflow

1. **Terminal 1**: `npm run dev` (Backend)
2. **Terminal 2**: `ngrok http 3000` (Tunnel)
3. **Copy ngrok URL** from Terminal 2
4. **Update .env** with ngrok URL + M-Pesa credentials
5. **Restart backend** (Ctrl+C then `npm run dev`)
6. **Frontend initiates payment** → Backend calls M-Pesa → M-Pesa calls your callback URL
7. **Monitor** in ngrok web inspector (http://localhost:4040)

---

## 🐛 Troubleshooting

### "Connection refused"
- Backend not running? Start it: `npm run dev`
- Wrong port? Should be 3000

### "ngrok not found"
- Install ngrok or add to PATH
- Or use full path: `C:\ngrok\ngrok.exe http 3000`

### M-Pesa returns error
- Check Consumer Key/Secret in .env
- Verify callback URL is HTTPS
- Check MPESA_SHORTCODE format

### "Invalid phone number"
- Use format: `+254712345678` or `0712345678`
- Must be exactly 12 digits (with country code)

### Callback URL not receiving data
- Check ngrok is running
- Monitor http://localhost:4040
- Verify URL in M-Pesa dashboard matches ngrok URL

---

## 📝 Quick Command Reference

```powershell
# Start ngrok
ngrok http 3000

# Test health endpoint
curl https://your-ngrok-url.ngrok-free.app/api/health

# View ngrok logs
# Browser: http://localhost:4040

# Restart backend after .env changes
# Terminal: Ctrl+C then npm run dev
```

---

**You're all set! Your M-Pesa integration is now exposed to the internet.** 🎉
