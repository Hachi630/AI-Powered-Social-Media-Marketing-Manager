import express, { Request, Response } from 'express'
import axios from 'axios'
import { protect } from '../middleware/auth'
import { AuthRequest } from '../types'
import User from '../models/User'
import {
  getInstagramAuthUrl,
  exchangeCodeForToken,
  getLongLivedToken,
  getInstagramAccountIdForPage,
  getFacebookPages,
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

    // Get user's Facebook Pages
    const pages = await getFacebookPages(longLivedToken.accessToken)
    
    // Filter to only pages with Instagram accounts
    const pagesWithInstagram = pages.filter((page) => page.hasInstagramAccount)

    if (pagesWithInstagram.length === 0) {
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?error=no_instagram_account`
      )
    }

    // If only one page, connect it directly
    if (pagesWithInstagram.length === 1) {
      const selectedPage = pagesWithInstagram[0]
      
      // Get Instagram account for selected page
      const instagramAccount = await getInstagramAccountIdForPage(
        selectedPage.id,
        longLivedToken.accessToken
      )

      // Calculate expiration date
      const expiresAt = new Date()
      expiresAt.setSeconds(expiresAt.getSeconds() + longLivedToken.expiresIn)

      // Save to user
      if (!user.socialConnections) {
        user.socialConnections = {}
      }

      // Save Instagram connection
      user.socialConnections.instagram = {
        accessToken: longLivedToken.accessToken,
        userId: instagramAccount.instagramAccountId,
        username: instagramAccount.username,
        accountType: instagramAccount.accountType,
        expiresAt,
      }

      // Also save Facebook Page connection
      user.socialConnections.facebook = {
        accessToken: longLivedToken.accessToken,
        userId: instagramAccount.facebookPageId,
        expiresAt,
      }

      await user.save()

      console.log('[Instagram OAuth] Successfully connected single page:', {
        userId: user._id,
        instagramUserId: user.socialConnections.instagram?.userId,
        instagramUsername: user.socialConnections.instagram?.username,
        facebookPageId: user.socialConnections.facebook?.userId,
      })

      // Redirect to settings with success message
      res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?instagram_connected=true`
      )
    } else {
      // Multiple pages - store token and redirect to selection page
      const tempTokenKey = `temp_token_${user._id}_${Date.now()}`
      oauthStates.set(tempTokenKey, JSON.stringify({
        userId: user._id.toString(),
        accessToken: longLivedToken.accessToken,
        expiresIn: longLivedToken.expiresIn,
      }))

      // Redirect to page selection page with token key
      res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/select-facebook-page?token_key=${tempTokenKey}`
      )
    }
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

    console.log('[Instagram Share] Request received:', {
      userId: user._id,
      calendarItemId,
      hasContent: !!content,
      hasImageUrl: !!imageUrl,
      socialConnections: user.socialConnections ? 'exists' : 'null',
      instagramToken: user.socialConnections?.instagram?.accessToken ? 'exists' : 'missing',
    })

    if (!calendarItemId || !content) {
      return res.status(400).json({
        success: false,
        message: 'calendarItemId and content are required',
      })
    }

    // Check if user has Instagram connected
    if (!user.socialConnections?.instagram?.accessToken) {
      console.log('[Instagram Share] Instagram not connected for user:', user._id)
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
 * @desc    Get user's Facebook Pages list (for selection)
 * @route   GET /api/social/pages
 * @access  Private
 */
router.get('/pages', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const { token_key } = req.query

    if (!token_key) {
      return res.status(400).json({
        success: false,
        message: 'Token key is required. Please complete OAuth flow first.',
      })
    }

    // Get temporary token
    const tempTokenData = oauthStates.get(token_key as string)
    if (!tempTokenData) {
      return res.status(400).json({
        success: false,
        message: 'Token expired or invalid. Please reconnect your account.',
      })
    }

    const { accessToken } = JSON.parse(tempTokenData)

    // Get Facebook Pages
    const pages = await getFacebookPages(accessToken)

    res.json({
      success: true,
      pages,
      tokenKey: token_key, // Return token key for later use
    })
  } catch (error: any) {
    console.error('Error getting Facebook pages:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get Facebook pages',
    })
  }
})

/**
 * @desc    Connect selected Facebook Page and Instagram Account
 * @route   POST /api/social/connect-page
 * @access  Private
 */
router.post('/connect-page', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const { pageId, tokenKey } = req.body

    if (!pageId || !tokenKey) {
      return res.status(400).json({
        success: false,
        message: 'pageId and tokenKey are required',
      })
    }

    // Get temporary token
    const tempTokenData = oauthStates.get(tokenKey)
    if (!tempTokenData) {
      return res.status(400).json({
        success: false,
        message: 'Token expired or invalid. Please reconnect your account.',
      })
    }

    const { accessToken, expiresIn } = JSON.parse(tempTokenData)

    // Get Instagram account for selected page
    const instagramAccount = await getInstagramAccountIdForPage(pageId, accessToken)

    // Calculate expiration date
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn)

    // Save to user
    if (!user.socialConnections) {
      user.socialConnections = {}
    }

    // Save Instagram connection
    user.socialConnections.instagram = {
      accessToken: accessToken,
      userId: instagramAccount.instagramAccountId,
      username: instagramAccount.username,
      accountType: instagramAccount.accountType,
      expiresAt,
    }

    // Also save Facebook Page connection
    user.socialConnections.facebook = {
      accessToken: accessToken,
      userId: instagramAccount.facebookPageId,
      expiresAt,
    }

    await user.save()

    // Clean up temporary token
    oauthStates.delete(tokenKey)

    console.log('[Instagram OAuth] Successfully saved connections:', {
      userId: user._id,
      instagramUserId: user.socialConnections.instagram?.userId,
      instagramUsername: user.socialConnections.instagram?.username,
      facebookPageId: user.socialConnections.facebook?.userId,
      expiresAt: expiresAt.toISOString(),
    })

    res.json({
      success: true,
      message: 'Successfully connected Instagram and Facebook Page',
      instagram: {
        userId: instagramAccount.instagramAccountId,
        username: instagramAccount.username,
        accountType: instagramAccount.accountType,
      },
      facebook: {
        pageId: instagramAccount.facebookPageId,
        pageName: instagramAccount.facebookPageName,
      },
    })
  } catch (error: any) {
    console.error('Error connecting page:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to connect page',
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

/**
 * @desc    Share calendar item to Facebook
 * @route   POST /api/social/facebook/share
 * @access  Private
 */
router.post('/facebook/share', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const { calendarItemId, content, imageUrl } = req.body

    console.log('[Facebook Share] Request received:', {
      userId: user._id,
      calendarItemId,
      hasContent: !!content,
      hasImageUrl: !!imageUrl,
      socialConnections: user.socialConnections ? 'exists' : 'null',
      facebookToken: user.socialConnections?.facebook?.accessToken ? 'exists' : 'missing',
      instagramToken: user.socialConnections?.instagram?.accessToken ? 'exists' : 'missing',
    })

    if (!calendarItemId || !content) {
      return res.status(400).json({
        success: false,
        message: 'calendarItemId and content are required',
      })
    }

    // Check if user has Facebook connected (either directly or through Instagram)
    // Instagram connection also provides Facebook Page access with the same token
    const facebook = user.socialConnections?.facebook
    const instagram = user.socialConnections?.instagram

    // Use Facebook connection if available, otherwise try Instagram token (which also works for Facebook Page)
    let facebookToken: string | undefined
    let facebookUserId: string | undefined
    let isUsingInstagramToken = false

    if (facebook?.accessToken) {
      // Check if token is expired
      if (facebook.expiresAt && new Date() > facebook.expiresAt) {
        return res.status(401).json({
          success: false,
          message: 'Facebook access token expired. Please reconnect your account.',
          requiresAuth: true,
        })
      }
      facebookToken = facebook.accessToken
      facebookUserId = facebook.userId
    } else if (instagram?.accessToken) {
      // Instagram token can also be used for Facebook Page
      // Check if token is expired
      if (instagram.expiresAt && new Date() > instagram.expiresAt) {
        return res.status(401).json({
          success: false,
          message: 'Access token expired. Please reconnect your Instagram account.',
          requiresAuth: true,
        })
      }
      facebookToken = instagram.accessToken
      isUsingInstagramToken = true
      
      // For Instagram token, we need to get the Facebook Page ID
      // This should have been saved during Instagram OAuth, but if not, fetch it
      if (facebook?.userId) {
        facebookUserId = facebook.userId // Use saved Page ID
      } else {
        // Fetch Facebook Page ID from Instagram connection
        try {
          const pagesResponse = await axios.get(
            `https://graph.facebook.com/v18.0/me/accounts?access_token=${facebookToken}`
          )
          if (pagesResponse.data.data && pagesResponse.data.data.length > 0) {
            facebookUserId = pagesResponse.data.data[0].id
            // Save it for future use
            if (!user.socialConnections) {
              user.socialConnections = {}
            }
            if (!user.socialConnections.facebook) {
              user.socialConnections.facebook = { accessToken: facebookToken }
            }
            user.socialConnections.facebook.userId = facebookUserId
            user.socialConnections.facebook.expiresAt = instagram.expiresAt
            await user.save()
          }
        } catch (error) {
          console.error('Error fetching Facebook Page ID:', error)
        }
      }
    }

    if (!facebookToken || !facebookUserId) {
      return res.status(400).json({
        success: false,
        message: 'Facebook account not connected. Please connect your Facebook or Instagram account first.',
        requiresAuth: true,
      })
    }

    // Share to Facebook using Graph API
    let postId: string
    let permalink: string | undefined

    try {

      // If imageUrl is provided, create a post with photo
      if (imageUrl) {
        // First, upload the photo
        const photoResponse = await axios.post(
          `https://graph.facebook.com/v18.0/${facebookUserId}/photos`,
          {
            url: imageUrl,
            message: content,
            access_token: facebookToken,
          }
        )
        postId = photoResponse.data.id
        permalink = photoResponse.data.post_id ? `https://www.facebook.com/photo.php?fbid=${postId}` : undefined
      } else {
        // Create a text-only post
        const postResponse = await axios.post(
          `https://graph.facebook.com/v18.0/${facebookUserId}/feed`,
          {
            message: content,
            access_token: facebookToken,
          }
        )
        postId = postResponse.data.id
        permalink = `https://www.facebook.com/${postId}`
      }

      res.json({
        success: true,
        message: 'Successfully shared to Facebook',
        postId,
        permalink,
      })
    } catch (error: any) {
      console.error('Facebook API error:', error.response?.data || error.message)
      
      // Check if it's an authentication error
      if (error.response?.status === 401 || error.response?.data?.error?.code === 190) {
        return res.status(401).json({
          success: false,
          message: isUsingInstagramToken 
            ? 'Access token expired or invalid. Please reconnect your Instagram account.'
            : 'Facebook access token expired or invalid. Please reconnect your account.',
          requiresAuth: true,
        })
      }

      throw error
    }
  } catch (error: any) {
    console.error('Facebook share error:', error)
    res.status(500).json({
      success: false,
      message: error.response?.data?.error?.message || error.message || 'Failed to share to Facebook',
    })
  }
})

/**
 * @desc    Get Facebook connection status
 * @route   GET /api/social/facebook/status
 * @access  Private
 */
router.get('/facebook/status', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const facebook = user.socialConnections?.facebook

    if (!facebook || !facebook.accessToken) {
      return res.json({
        success: true,
        connected: false,
      })
    }

    // Check if token is expired
    const isExpired = facebook.expiresAt && new Date() > facebook.expiresAt

    res.json({
      success: true,
      connected: !isExpired,
      userId: facebook.userId,
      expiresAt: facebook.expiresAt,
    })
  } catch (error: any) {
    console.error('Facebook status error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get Facebook status',
    })
  }
})

export default router

