# 🔗 LinkedIn Integration Setup Guide

This guide will help you set up the LinkedIn API integration so the "Connect to LinkedIn" feature works correctly.

## ⚠️ Common Issues

If the LinkedIn connect button doesn't redirect properly or shows errors, check these:

### Issue 1: Missing Environment Variables

**Symptoms:**
- Button doesn't redirect
- "Cannot connect" error
- Blank page after clicking

**Solution:**
Make sure you have ALL these variables in `backend/.env`:

```env
LI_CLIENT_ID=your_linkedin_client_id
LI_CLIENT_SECRET=your_linkedin_client_secret
LI_REDIRECT_URI=http://localhost:5000/linkedin/callback
CLIENT_URL=http://localhost:3000
```

**Important Notes:**
- `LI_REDIRECT_URI` must match EXACTLY what you set in LinkedIn Developer Portal
- `CLIENT_URL` must match your frontend URL (default: `http://localhost:3000`)
- If your frontend runs on a different port, update `CLIENT_URL` accordingly

### Issue 2: LinkedIn App Configuration Mismatch

**Symptoms:**
- Redirects to LinkedIn but shows "Invalid redirect_uri" error
- "Bummer something went wrong" page

**Solution:**
1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Select your app
3. Go to **"Auth"** tab
4. Under **"Authorized redirect URLs for your app"**, add:
   ```
   http://localhost:5000/linkedin/callback
   ```
5. **IMPORTANT:** The URL must match EXACTLY (including `http://` not `https://` for localhost)
6. Click **"Update"**

### Issue 3: Missing LinkedIn Products

**Symptoms:**
- Can connect but can't post
- "Not enough permissions" errors

**Solution:**
1. In LinkedIn Developer Portal, go to **"Products"** tab
2. Request access to:
   - ✅ **Sign In with LinkedIn using OpenID Connect** (required)
   - ✅ **Share on LinkedIn** (required for posting)
   - ✅ **Community Management API** (optional, for Events feature)
3. Wait for approval (usually instant for basic products)

### Issue 4: Port Mismatch

**Symptoms:**
- Works on your machine but not teammate's
- Redirects to wrong URL

**Solution:**
Check that both backend and frontend ports match:

**Backend** (`backend/.env`):
```env
PORT=5000
LI_REDIRECT_URI=http://localhost:5000/linkedin/callback
CLIENT_URL=http://localhost:3000
```

**Frontend** (`frontend/.env`):
```env
VITE_BACKEND_PORT=5000
```

If your teammate uses different ports, they need to:
1. Update `backend/.env` with their ports
2. Update `frontend/.env` with their backend port
3. Update LinkedIn app redirect URI to match their backend port

## 📋 Step-by-Step Setup Checklist

### Backend Setup

- [ ] Create `backend/.env` file
- [ ] Add `LI_CLIENT_ID` (from LinkedIn Developer Portal)
- [ ] Add `LI_CLIENT_SECRET` (from LinkedIn Developer Portal)
- [ ] Add `LI_REDIRECT_URI=http://localhost:5000/linkedin/callback`
- [ ] Add `CLIENT_URL=http://localhost:3000` (or your frontend URL)
- [ ] Run `npm install` in `backend/` directory
- [ ] Start backend: `npm run dev`

### LinkedIn App Setup

- [ ] Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
- [ ] Create new app or select existing app
- [ ] Go to **"Auth"** tab
- [ ] Add redirect URI: `http://localhost:5000/linkedin/callback`
- [ ] Go to **"Products"** tab
- [ ] Request access to "Sign In with LinkedIn using OpenID Connect"
- [ ] Request access to "Share on LinkedIn"
- [ ] Copy **Client ID** to `backend/.env` as `LI_CLIENT_ID`
- [ ] Copy **Client Secret** to `backend/.env` as `LI_CLIENT_SECRET`

### Frontend Setup

- [ ] Create `frontend/.env` file (if not exists)
- [ ] Add `VITE_BACKEND_PORT=5000` (or your backend port)
- [ ] Run `npm install` in `frontend/` directory
- [ ] Start frontend: `npm run dev`
- [ ] Verify frontend runs on `http://localhost:3000`

### Testing

- [ ] Navigate to `http://localhost:3000/socialdashboard`
- [ ] Click "Connect LinkedIn" button
- [ ] Should redirect to LinkedIn login page
- [ ] After authorizing, should redirect back to social dashboard
- [ ] Should show "Connected" status

## 🔍 Debugging Tips

### Check Backend Logs

When you click "Connect LinkedIn", check your backend terminal. You should see:
```
LinkedIn OAuth redirect URL: https://www.linkedin.com/oauth/v2/authorization?...
```

If you don't see this, the backend route isn't being called.

### Check Browser Console

Open browser DevTools (F12) and check:
- **Console tab**: Look for errors
- **Network tab**: Check if `/linkedin/auth` request is made
- **Network tab**: Check redirect responses

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid redirect_uri" | Redirect URI doesn't match LinkedIn app | Update LinkedIn app redirect URI |
| "Cannot connect: userId not available" | User not logged in | Login first, then connect LinkedIn |
| "Not enough permissions" | Missing LinkedIn products | Enable products in LinkedIn Developer Portal |
| Blank page after redirect | Wrong CLIENT_URL | Update CLIENT_URL in backend/.env |

## 🚀 Quick Fix Commands

If it's not working, try these in order:

```bash
# 1. Check environment variables are set
cd backend
cat .env | grep LI_

# 2. Restart backend (to load new env vars)
# Stop backend (Ctrl+C), then:
npm run dev

# 3. Restart frontend (to load new env vars)
cd ../frontend
# Stop frontend (Ctrl+C), then:
npm run dev

# 4. Clear browser cache and try again
# Or use incognito/private window
```

## 📝 Environment Variables Reference

### Backend (`backend/.env`)

```env
# Required for LinkedIn
LI_CLIENT_ID=your_client_id_here
LI_CLIENT_SECRET=your_client_secret_here
LI_REDIRECT_URI=http://localhost:5000/linkedin/callback
CLIENT_URL=http://localhost:3000

# Other required vars
PORT=5000
MONGODB_URI=mongodb://localhost:27017/melo
JWT_SECRET=your_secret_key
```

### Frontend (`frontend/.env`)

```env
# Required
VITE_BACKEND_PORT=5000

# Optional (only if not using vite proxy)
# VITE_API_URL=http://localhost:5000
```

## 🆘 Still Not Working?

1. **Verify all environment variables are set:**
   ```bash
   cd backend
   echo "LI_CLIENT_ID: $LI_CLIENT_ID"
   echo "LI_CLIENT_SECRET: $LI_CLIENT_SECRET"
   echo "LI_REDIRECT_URI: $LI_REDIRECT_URI"
   echo "CLIENT_URL: $CLIENT_URL"
   ```

2. **Check LinkedIn app settings match exactly:**
   - Redirect URI in LinkedIn app = `LI_REDIRECT_URI` in `.env`
   - Client ID matches
   - Products are enabled

3. **Check ports are correct:**
   - Backend running on port 5000 (or your PORT)
   - Frontend running on port 3000
   - `CLIENT_URL` matches frontend URL

4. **Check user is logged in:**
   - LinkedIn connect requires user to be authenticated first
   - Make sure you're logged into the app before connecting LinkedIn

5. **Try in incognito/private window:**
   - Clears any cached redirect issues

## 📞 Need More Help?

If you've checked everything above and it still doesn't work:
1. Check backend terminal for error messages
2. Check browser console (F12) for errors
3. Verify all npm packages are installed: `npm install` in both backend and frontend
4. Make sure MongoDB is running (if using local MongoDB)

