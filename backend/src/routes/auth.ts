import express, { Request, Response } from 'express'
import User from '../models/User'
import { generateToken } from '../utils/jwt'
import { protect } from '../middleware/auth'
import { AuthRequest } from '../types'

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

export default router

