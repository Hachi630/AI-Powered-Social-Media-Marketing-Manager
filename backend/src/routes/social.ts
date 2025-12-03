import express, { Request, Response } from 'express'
import { protect } from '../middleware/auth'
import { AuthRequest } from '../types'
import User from '../models/User'
import {
  getInstagramAuthUrl,
  exchangeCodeForToken,
  getLongLivedToken,
  getInstagramAccountId,
  shareToInstagram,
} from '../services/instagramService'
import crypto from 'crypto'

const router = express.Router()

// Store OAuth states temporarily (in production, use Redis or similar)
const oauthStates = new Map<string, string>()

/**
 * @desc    Initiate Instagram OAuth flow
 * @route   GET /api/social/instagram/auth
 * @access  Private
 */
router.get('/instagram/auth', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex')
    oauthStates.set(state, user.id.toString())

    // Generate Instagram OAuth URL
    const authUrl = getInstagramAuthUrl(state)

    res.json({
      success: true,
      authUrl,
      state,
    })
  } catch (error: any) {
    console.error('Instagram OAuth initiation error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate Instagram OAuth',
    })
  }
})

/**
 * @desc    Instagram OAuth callback
 * @route   GET /api/social/instagram/callback
 * @access  Public (called by Facebook)
 */
router.get('/instagram/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query

    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?error=${encodeURIComponent(error as string)}`)
    }

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?error=missing_code_or_state`)
    }

    // Verify state
    const userId = oauthStates.get(state as string)
    if (!userId) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?error=invalid_state`)
    }

    oauthStates.delete(state as string)

    // Find user
    const user = await User.findById(userId)
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?error=user_not_found`)
    }

    // Exchange code for short-lived token
    const tokenData = await exchangeCodeForToken(code as string)

    // Exchange for long-lived token
    const longLivedToken = await getLongLivedToken(tokenData.accessToken)

    // Get Instagram account information
    const instagramAccount = await getInstagramAccountId(longLivedToken.accessToken)

    // Calculate expiration date
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + longLivedToken.expiresIn)

    // Save to user
    if (!user.socialConnections) {
      user.socialConnections = {}
    }

    user.socialConnections.instagram = {
      accessToken: longLivedToken.accessToken,
      userId: instagramAccount.instagramAccountId,
      username: instagramAccount.username,
      accountType: instagramAccount.accountType,
      expiresAt,
    }

    await user.save()

    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?instagram_connected=true`)
  } catch (error: any) {
    console.error('Instagram OAuth callback error:', error)
    res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?error=${encodeURIComponent(error.message || 'oauth_failed')}`
    )
  }
})

/**
 * @desc    Share calendar item to Instagram
 * @route   POST /api/social/instagram/share
 * @access  Private
 */
router.post('/instagram/share', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const { calendarItemId, content, imageUrl } = req.body

    if (!calendarItemId || !content) {
      return res.status(400).json({
        success: false,
        message: 'calendarItemId and content are required',
      })
    }

    // Check if user has Instagram connected
    if (!user.socialConnections?.instagram?.accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Instagram account not connected. Please connect your Instagram account first.',
        requiresAuth: true,
      })
    }

    const instagram = user.socialConnections.instagram

    // Check if token is expired
    if (instagram.expiresAt && new Date() > instagram.expiresAt) {
      return res.status(401).json({
        success: false,
        message: 'Instagram access token expired. Please reconnect your account.',
        requiresAuth: true,
      })
    }

    // Share to Instagram
    const result = await shareToInstagram(
      instagram.userId!,
      instagram.accessToken,
      {
        text: content,
        imageUrl: imageUrl || undefined,
      }
    )

    res.json({
      success: true,
      message: 'Successfully shared to Instagram',
      postId: result.postId,
      permalink: result.permalink,
    })
  } catch (error: any) {
    console.error('Instagram share error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to share to Instagram',
    })
  }
})

/**
 * @desc    Get Instagram connection status
 * @route   GET /api/social/instagram/status
 * @access  Private
 */
router.get('/instagram/status', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const instagram = user.socialConnections?.instagram

    if (!instagram || !instagram.accessToken) {
      return res.json({
        success: true,
        connected: false,
      })
    }

    // Check if token is expired
    const isExpired = instagram.expiresAt && new Date() > instagram.expiresAt

    res.json({
      success: true,
      connected: !isExpired,
      username: instagram.username,
      accountType: instagram.accountType,
      expiresAt: instagram.expiresAt,
    })
  } catch (error: any) {
    console.error('Instagram status error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get Instagram status',
    })
  }
})

export default router

