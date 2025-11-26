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

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/melo
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

**Note**: Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/)

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
```

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
```

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

### Chat Endpoints

#### 1. Send Chat Message
**POST** `/api/chat`

Send a message to the AI chat and receive a response based on user's Brand Profile.

**Access:** Private (Requires authentication)

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "What marketing strategies work best for my brand?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant",
      "content": "Hello! How can I help you today?"
    }
  ]
}
```

**Note:** `conversationHistory` is optional. If provided, it should contain the last 10 messages for context.

**Success Response (200):**
```json
{
  "success": true,
  "response": "Based on your brand profile, I recommend focusing on..."
}
```

**Error Responses:**
- `400` - Message is required
- `401` - Not authorized
- `404` - User not found
- `500` - Server error or Gemini API error

---

## 📊 Data Models

### User
```typescript
{
  id: string          // MongoDB ObjectId (as string)
  email: string       // User email (unique, lowercase)
  createdAt: string   // ISO 8601 timestamp
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

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Internal Server Error |

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
