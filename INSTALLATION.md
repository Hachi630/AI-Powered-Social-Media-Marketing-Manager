# 📦 Installation Guide for LinkedIn API Integration

This guide will help you install all required packages and set up the LinkedIn API integration.

## Prerequisites

- Node.js (v18.16.1 or higher)
- npm or yarn
- MongoDB (local installation or MongoDB Atlas)
- A LinkedIn Developer App (for API credentials)

## Step-by-Step Installation

### 1. Clone and Navigate to Project

```bash
git clone <repository-url>
cd Melo
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

**What this installs:**
- `axios@^1.13.2` - HTTP client for LinkedIn API requests
- `qs@^6.14.0` - Query string encoding for OAuth flow
- `express@^4.21.1` - Web framework
- `mongoose@^9.0.0` - MongoDB ODM for storing LinkedIn tokens
- All other backend dependencies

**Expected output:**
```
added 322 packages, and audited 322 packages in Xs
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

**Expected output:**
```
added XXX packages, and audited XXX packages in Xs
```

### 4. Set Up Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cd ../backend
touch .env
```

Add the following variables to `backend/.env`:

```env
# Server Configuration
PORT=5000
MONGODB_URI=mongodb://localhost:27017/melo

# JWT Configuration
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d

# Gemini API (for chat features)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# LinkedIn API Credentials (REQUIRED for LinkedIn features)
LI_CLIENT_ID=your_linkedin_client_id
LI_CLIENT_SECRET=your_linkedin_client_secret
LI_REDIRECT_URI=http://localhost:5000/linkedin/callback
CLIENT_URL=http://localhost:3000

# Twitter/X API (optional)
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_SECRET=your_twitter_access_secret
```

### 5. Get LinkedIn API Credentials

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Click "Create app" or select an existing app
3. Go to the "Auth" tab
4. Copy your **Client ID** and **Client Secret**
5. Add authorized redirect URL: `http://localhost:5000/linkedin/callback`
6. Go to "Products" tab and request access to:
   - ✅ **Sign In with LinkedIn using OpenID Connect**
   - ✅ **Share on LinkedIn**
   - ✅ **Community Management API** (for Events - optional)
7. Update your `.env` file with the credentials

### 6. Verify Installation

Check that all packages are installed:

```bash
# In backend directory
cd backend
npm list axios qs express mongoose

# Should show:
# ├── axios@1.13.2
# ├── express@4.22.1
# ├── mongoose@9.0.0
# └── qs@6.14.0
```

### 7. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 8. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/api/health

## Troubleshooting

### Issue: "Cannot find module 'axios'" or similar errors

**Solution:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Issue: "LinkedIn OAuth error" or "Invalid client"

**Solution:**
1. Verify your `LI_CLIENT_ID` and `LI_CLIENT_SECRET` in `backend/.env`
2. Make sure the redirect URI matches exactly: `http://localhost:5000/linkedin/callback`
3. Check that your LinkedIn app has the required products enabled

### Issue: "MongoDB connection error"

**Solution:**
1. Make sure MongoDB is running locally, OR
2. Update `MONGODB_URI` in `backend/.env` to your MongoDB Atlas connection string

### Issue: Port already in use

**Solution:**
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

## Quick Installation Script

For a quick setup, you can run these commands in sequence:

```bash
# Clone and navigate
git clone <repository-url>
cd Melo

# Install backend
cd backend && npm install && cd ..

# Install frontend
cd frontend && npm install && cd ..

# Create .env file (you'll need to add your credentials manually)
cd backend
touch .env
echo "PORT=5000" >> .env
echo "MONGODB_URI=mongodb://localhost:27017/melo" >> .env
echo "# Add your other credentials here" >> .env

echo "✅ Installation complete!"
echo "📝 Don't forget to add your API credentials to backend/.env"
```

## Required npm Packages Summary

### Backend (LinkedIn API)
- ✅ `axios` - HTTP requests
- ✅ `qs` - OAuth encoding
- ✅ `express` - Web framework
- ✅ `mongoose` - Database

All packages are automatically installed with `npm install` in the backend directory.

## Need Help?

If you encounter any issues:
1. Check that all dependencies are installed: `npm list`
2. Verify your `.env` file has all required variables
3. Make sure MongoDB is running
4. Check the console for specific error messages

