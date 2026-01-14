# Twilio Credentials Setup

## ⚠️ IMPORTANT: Authentication Error Fix

If you're getting "Twilio authentication failed" error, you need to add your Twilio credentials to the `.env` file.

## Step 1: Get Your Twilio Credentials

1. Go to [Twilio Console](https://console.twilio.com/)
2. Log in to your account
3. Go to **Account** → **API Keys & Tokens**
4. Copy your:
   - **Account SID** (starts with `AC`)
   - **Auth Token** (click "View" to reveal it)
   - **Phone Number** (from Phone Numbers section)

## Step 2: Add to backend/.env

Open `backend/.env` and add:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=your_actual_auth_token_here
TWILIO_PHONE_NUMBER=+18509898481
```

**Important:** 
- Replace `your_actual_auth_token_here` with your actual Auth Token from Twilio Console
- Make sure there are no spaces around the `=` sign
- The Auth Token is case-sensitive

## Step 3: Restart Backend Server

After adding the credentials, restart your backend server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd backend
npm run dev
```

## Step 4: Verify Credentials

Check the backend console when it starts. You should see:
```
✅ Twilio client initialized successfully
```

If you see an error, double-check:
1. The credentials are correct (no typos)
2. The Auth Token hasn't been regenerated (if regenerated, use the new one)
3. The Account SID and Auth Token are from the same account
4. There are no extra spaces or quotes in the .env file

## Your Credentials (from your message)

Based on your provided credentials:

```env
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=+18509898481
```

**Note:** If the Auth Token `YOUR_TWILIO_AUTH_TOKEN` doesn't work, you may need to:
1. Check if it was regenerated in Twilio Console
2. Use the current Auth Token from your Twilio Console
3. Make sure you're using the "Live" credentials, not "Test" credentials

## Troubleshooting

### Error: "Twilio authentication failed (Error 20003)"

This means your credentials are incorrect. Check:
- ✅ Account SID is correct (starts with `AC`)
- ✅ Auth Token is correct (32 characters, no spaces)
- ✅ Both are from the same Twilio account
- ✅ Auth Token hasn't been regenerated (if yes, use the new one)

### Error: "Invalid phone number format"

Make sure your phone number is in E.164 format:
- ✅ `+1234567890` (with country code)
- ✅ `1234567890` (will be auto-converted to +11234567890 for US)

### Still having issues?

1. Go to [Twilio Console](https://console.twilio.com/)
2. Verify your Account SID and Auth Token
3. Make sure your account is active (not suspended)
4. Check that you have sufficient balance for SMS







