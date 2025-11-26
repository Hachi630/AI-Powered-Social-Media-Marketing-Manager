# 🚀 AI-Powered Social Media & Marketing Manager - Melo

Melo is an AI-powered social media and marketing management platform that helps businesses create, manage, and optimize their social media content and marketing strategies.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Development](#development)

## ✨ Features

- **User Authentication**: Secure login and registration system with JWT authentication
- **Dashboard**: Clean and intuitive interface for managing your marketing activities
- **Brand Profile**: Configure your brand's tone of voice, target audience, and knowledge base
- **Smart Calendar**: Schedule and manage your marketing campaigns
- **Chat Interface**: AI-powered chat interface for content creation and marketing assistance
- **Responsive Design**: Modern UI built with Ant Design, fully responsive across devices

## 🛠 Tech Stack

### Frontend

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Ant Design 6** - UI component library
- **React Router DOM 6** - Routing
- **CSS Modules** - Component-scoped styling
- **dayjs** - Date manipulation

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **MongoDB** - Database (via Mongoose)
- **JWT** - Authentication tokens
- **dotenv** - Environment variable management

## 📁 Project Structure

```
Melo/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ChatBox.tsx
│   │   │   └── AuthModal.tsx
│   │   ├── pages/           # Page components
│   │   │   ├── BrandProfile.tsx
│   │   │   └── CalendarPlaceholder.tsx
│   │   ├── services/        # API service layer
│   │   │   └── authService.ts
│   │   ├── constants/       # Constants and assets
│   │   │   └── assets.ts
│   │   └── App.tsx          # Main app component
│   └── package.json
│
├── backend/                  # Express backend API
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   │   └── database.ts
│   │   ├── models/          # MongoDB models
│   │   │   └── User.ts
│   │   ├── routes/          # API routes
│   │   │   └── auth.ts
│   │   ├── middleware/      # Express middleware
│   │   │   ├── auth.ts
│   │   │   └── errorHandler.ts
│   │   ├── utils/           # Utility functions
│   │   │   └── jwt.ts
│   │   ├── types/           # TypeScript types
│   │   │   └── index.ts
│   │   └── index.ts          # Entry point
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.16.1 or higher)
- npm or yarn
- MongoDB (local installation or MongoDB Atlas)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Melo
   ```

2. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start MongoDB** (if running locally)

   ```bash
   # Make sure MongoDB is running on localhost:27017
   # Or update MONGODB_URI in backend/.env
   ```

2. **Start the backend server**

   ```bash
   cd backend
   npm run dev
   # Server runs on http://localhost:5000
   ```

3. **Start the frontend development server**

   ```bash
   cd frontend
   npm run dev
   # Frontend runs on http://localhost:3000
   ```

4. **Open your browser**
   - Navigate to `http://localhost:3000`

## 🔐 Environment Variables

### Backend (.env)

Create a `.env` file in the `backend/` directory:

````env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/melo
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d

### OAuth Provider Config
For social login, add the following to `backend/.env` and create OAuth credentials in the provider consoles (Google, Microsoft, Apple):

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
````

### Frontend (VITE environment variables)

Frontend-only demo redirects (useful when backend is not set up yet): add to `frontend/.env` or `frontend/.env.local` with these variables:

```
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_MICROSOFT_CLIENT_ID=your-microsoft-client-id
VITE_MICROSOFT_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_APPLE_CLIENT_ID=your-apple-client-id
VITE_APPLE_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_PHONE_DEMO_URL=/auth/phone-demo
```

These allow the frontend `AuthModal` to directly redirect to the provider authorization pages without a running backend (for demonstration). For Google/Microsoft you still need to register the redirect URIs in their consoles matching these redirect URIs.

Note: For Apple sign-in and phone-based OTP, follow the provider-specific docs linked in the Implementation section below.

### Google-specific troubleshooting

If you see a page like "Access to localhost was denied" or `HTTP ERROR 403` while attempting to test a Google OAuth login, it usually means one of the following:

- **Redirect URI mismatch**: The redirect URI you registered in the Google Cloud Console must exactly match the URI used by your app (for the provided code it should be `http://localhost:5000/api/auth/google/callback`).
- **Missing client id / secret**: If `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` are missing in your backend `.env`, Google may reject the request. The backend will now return a helpful error HTML indicating these are missing.
- **Consent screen not configured / Test only**: If your OAuth consent screen is set to _Testing_, you must add your test accounts to the list of test users on the consent screen settings or publish the app. Otherwise Google will show an error and block the login attempt.
- **Account or domain restrictions**: If you are using an enterprise account with restricted OAuth or policies, the request may be blocked.

Steps to fix:

1. In the Google Cloud Console (https://console.developers.google.com/):
   - Create/select a project
   - Under APIs & Services -> OAuth consent screen: configure your app, set the app type (External/internal), add the developer contact email, and if the app is in Testing, add your Google account email as a test user.
   - Under Credentials -> Create credentials -> OAuth 2.0 Client ID -> Web application. Add the redirect URI: `http://localhost:5000/api/auth/google/callback` to the Authorized redirect URIs.
   - Copy the Client ID and Client Secret and add them to your `backend/.env`:
     ```env
     GOOGLE_CLIENT_ID=...
     GOOGLE_CLIENT_SECRET=...
     BACKEND_URL=http://localhost:5000
     FRONTEND_URL=http://localhost:5173
     ```
2. Restart the backend server.
3. Re-open the SPA, click the Google login button and it should redirect to Google and back to your app.

For Microsoft the setup is similar, but done in Azure Portal -> App Registrations -> (create app) -> Authentication -> Add redirect URI `http://localhost:5000/api/auth/microsoft/callback` and then add client secret under Certificates & secrets.

```

### Frontend

The frontend uses Vite's proxy configuration (see `frontend/vite.config.ts`) to proxy API requests to the backend.

## 📚 API Documentation

### Base URL
```

http://localhost:5000/api

```

### Authentication
Most endpoints require JWT authentication. Include the token in the request header:
```

Authorization: Bearer <token>

````

---

### General Endpoints

#### 1. Health Check
**GET** `/api/health`

Check server running status.

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
````

#### 2. API Welcome

**GET** `/api`

Get API welcome message.

**Response:**

```json
{
  "message": "Welcome to Melo API"
}
```

---

### Authentication Endpoints

#### 1. Register User

**POST** `/api/auth/register`

Register a new user account.

**Access:** Public

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

- `400` - Missing email/password or user already exists
- `500` - Server error

---

#### 2. Login User

**POST** `/api/auth/login`

Authenticate user and get access token.

**Access:** Public

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

- `400` - Missing email/password
- `401` - Invalid credentials
- `500` - Server error

---

#### 3. Get Current User

**GET** `/api/auth/me`

Get current authenticated user information.

**Access:** Private (Requires authentication)

**Request Headers:**

```
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

- `401` - Not authorized
- `404` - User not found
- `500` - Server error

---

#### 4. Logout User

**POST** `/api/auth/logout`

Logout user (client should remove token).

**Access:** Private (Requires authentication)

**Request Headers:**

```
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Error Responses:**

- `401` - Not authorized

---

## 📊 Data Models

### User

```typescript
{
  id: string; // MongoDB ObjectId (as string)
  email: string; // User email (unique, lowercase)
  createdAt: string; // ISO 8601 timestamp
}
```

### AuthResponse

```typescript
{
  success: boolean     // Request success status
  token?: string      // JWT token (on login/register)
  user?: User         // User information
  message?: string    // Error message
}
```

---

## 🔄 Authentication Flow

1. **Register/Login**: User calls `/api/auth/register` or `/api/auth/login`
2. **Receive Token**: Backend returns JWT token in response
3. **Store Token**: Frontend saves token to `localStorage`
4. **Authenticated Requests**: Include `Authorization: Bearer <token>` header
5. **Token Validation**: Backend middleware validates token on protected routes
6. **Logout**: Call `/api/auth/logout` and remove token from `localStorage`

---

## 💻 Development

### Backend Development

```bash
cd backend
npm run dev    # Start with hot reload (tsx watch)
npm run build  # Build for production
npm start      # Run production build
```

### Frontend Development

```bash
cd frontend
npm run dev    # Start dev server
npm run build  # Build for production
npm run preview # Preview production build
```

### Code Structure

- **Components**: Reusable UI components in `frontend/src/components/`
- **Pages**: Route-level components in `frontend/src/pages/`
- **Services**: API service layer in `frontend/src/services/`
- **Routes**: API endpoints in `backend/src/routes/`
- **Middleware**: Express middleware in `backend/src/middleware/`
- **Models**: Database models in `backend/src/models/`

---

## 🔒 Security Notes

⚠️ **Important**: This project currently stores passwords in **plain text** for demonstration purposes only.

**For production:**

- Implement password hashing (bcrypt)
- Use HTTPS
- Add rate limiting
- Implement proper input validation
- Add CORS restrictions
- Use environment variables for secrets

---

## 📝 HTTP Status Codes

| Code | Description           |
| ---- | --------------------- |
| 200  | Success               |
| 201  | Created               |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 404  | Not Found             |
| 500  | Internal Server Error |

---

## 🧪 Testing

### Test Authentication Flow

1. Register a new user via `/api/auth/register`
2. Login with credentials via `/api/auth/login`
3. Use the returned token to access `/api/auth/me`
4. Logout via `/api/auth/logout`

### Frontend Testing

The frontend automatically handles:

- Token storage in `localStorage`
- Token inclusion in authenticated requests
- Automatic token validation on app load
- Login state management across components

---

## 📄 License

[Add your license here]

---

## 👥 Contributors

[Add contributors here]

---

## 📞 Support

For issues and questions, please open an issue in the repository.
