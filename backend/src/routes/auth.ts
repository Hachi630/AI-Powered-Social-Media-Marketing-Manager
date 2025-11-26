import express, { Request, Response } from 'express'
import { OAuth2Client } from 'google-auth-library'
import dotenv from 'dotenv'
import User from '../models/User'
import { generateToken } from '../utils/jwt'
import { protect } from '../middleware/auth'
import { AuthRequest } from '../types'

dotenv.config()

// Validate Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback'

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || 
    GOOGLE_CLIENT_ID === 'your_google_client_id_here' || 
    GOOGLE_CLIENT_SECRET === 'your_google_client_secret_here') {
  console.warn('⚠️  Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env')
}

const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
)

const router = express.Router()

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    // Simple validation
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' })
    }

    // Check if user exists
    const userExists = await User.findOne({ email })

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' })
    }

    // Create user (Store password in plain text as requested)
    const user = await User.create({
      email,
      password,
    })

    if (user) {
      res.status(201).json({
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          createdAt: user.createdAt,
        },
        token: generateToken(user._id.toString()),
      })
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' })
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' })
    }

    // Check for user
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    // Check password (plain text comparison as requested)
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        createdAt: user.createdAt,
      },
      token: generateToken(user._id.toString()),
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        createdAt: user.createdAt,
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// @desc    Log user out
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, (req: Request, res: Response) => {
  // Client side should remove the token
  res.status(200).json({ success: true, message: 'Logged out successfully' })
})

// @desc    Initiate Google OAuth login
// @route   GET /api/auth/google
// @access  Public
router.get('/google', (req: Request, res: Response) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      prompt: 'consent',
    })
    res.redirect(authUrl)
  } catch (error: any) {
    console.error('Error generating Google OAuth URL:', error)
    // Let Google show the error instead of redirecting to frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    res.redirect(`${frontendUrl}/?error=google_oauth_error`)
  }
})

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.query

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?error=oauth_failed`)
    }

    const { tokens } = await oauth2Client.getToken(code as string)
    oauth2Client.setCredentials(tokens)

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()
    
    if (!payload) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?error=oauth_failed`)
    }

    const { email, sub: googleId, name, picture } = payload

    if (!email) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?error=no_email`)
    }

    let user = await User.findOne({ 
      $or: [
        { email },
        { googleId }
      ]
    })

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId
        user.authProvider = 'google'
        if (name) user.name = name
        if (picture) user.avatar = picture
        await user.save()
      }
    } else {
      user = await User.create({
        email,
        googleId,
        name: name || '',
        avatar: picture || '',
        authProvider: 'google',
      })
    }

    const token = generateToken(user._id.toString())

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`)
  } catch (error: any) {
    console.error('Google OAuth error:', error)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    res.redirect(`${frontendUrl}/?error=oauth_failed`)
  }
})

export default router

