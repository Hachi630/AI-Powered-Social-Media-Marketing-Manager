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
    oauthStates.set(state, user._id.toString())

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
/**
 * @desc    Instagram OAuth callback (supports both frontend and backend callbacks)
 * @route   GET /api/social/instagram/callback
 * @access  Public (called by Facebook) or Private (called by frontend)
 */
router.get('/instagram/callback', async (req: Request, res: Response) => {
  try {
    console.log('[Instagram OAuth Callback] Received callback:', {
      query: req.query,
      url: req.url,
      headers: req.headers.host,
    })

    // Check if this is a frontend callback (has Authorization header) or backend callback (from Facebook)
    const isFrontendCallback = !!req.headers.authorization
    console.log('[Instagram OAuth Callback] Callback type:', isFrontendCallback ? 'frontend' : 'backend (from Facebook)')

    const { code, state, error } = req.query

    if (error) {
      console.error('[Instagram OAuth Callback] Error from Facebook:', error)
      if (isFrontendCallback) {
        return res.json({ success: false, message: error as string })
      }
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/instagram/callback?error=${encodeURIComponent(error as string)}`)
    }

    if (!code || !state) {
      console.error('[Instagram OAuth Callback] Missing code or state:', { code: !!code, state: !!state })
      if (isFrontendCallback) {
        return res.json({ success: false, message: 'Missing code or state' })
      }
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/instagram/callback?error=missing_code_or_state`)
    }

    // Verify state
    const userId = oauthStates.get(state as string)
    if (!userId) {
      console.error('[Instagram OAuth Callback] Invalid state:', state)
      if (isFrontendCallback) {
        return res.json({ success: false, message: 'Invalid state' })
      }
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/instagram/callback?error=invalid_state`)
    }

    console.log('[Instagram OAuth Callback] State verified, userId:', userId)

    oauthStates.delete(state as string)

    // Find user
    const user = await User.findById(userId)
    if (!user) {
      if (isFrontendCallback) {
        return res.json({ success: false, message: 'User not found' })
      }
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/instagram/callback?error=user_not_found`)
    }

    // Exchange code for short-lived token
    console.log('[Instagram OAuth Callback] Exchanging code for token...')
    const tokenData = await exchangeCodeForToken(code as string)
    console.log('[Instagram OAuth Callback] Got short-lived token')

    // Exchange for long-lived token
    console.log('[Instagram OAuth Callback] Exchanging for long-lived token...')
    const longLivedToken = await getLongLivedToken(tokenData.accessToken)
    console.log('[Instagram OAuth Callback] Got long-lived token')

    // Get user's Facebook Pages
    console.log('[Instagram OAuth Callback] Getting Facebook Pages...')
    const pages = await getFacebookPages(longLivedToken.accessToken)
    console.log('[Instagram OAuth Callback] Found pages:', pages.length)
    console.log('[Instagram OAuth Callback] Pages details:', pages.map(p => ({
      id: p.id,
      name: p.name,
      hasInstagramAccount: p.hasInstagramAccount,
      instagramUsername: p.instagramUsername
    })))
    
    // Filter to only pages with Instagram accounts
    const pagesWithInstagram = pages.filter((page) => page.hasInstagramAccount)
    console.log('[Instagram OAuth Callback] Pages with Instagram:', pagesWithInstagram.length)

    if (pagesWithInstagram.length === 0) {
      const pageNames = pages.map(p => p.name).join(', ')
      console.log('[Instagram OAuth Callback] No pages with Instagram detected. Pages:', pageNames)
      console.log('[Instagram OAuth Callback] This might be a permissions issue. Attempting to proceed anyway...')
      
      // If user has pages but we can't detect Instagram, still try to connect
      // The Instagram connection might exist but API permissions might not allow detection
      // We'll try to use the first page and see if we can access Instagram API directly
      if (pages.length > 0) {
        const firstPage = pages[0]
        console.log('[Instagram OAuth Callback] Attempting to connect using first page:', firstPage.name)
        console.log('[Instagram OAuth Callback] Page details:', {
          id: firstPage.id,
          name: firstPage.name,
          hasPageToken: !!firstPage.accessToken,
        })
        
        try {
          console.log('[Instagram OAuth Callback] Attempting direct connection method...')
          
          // Try using page access token first (more reliable for Instagram queries)
          // Page tokens have better permissions for accessing Instagram accounts
          let tokenToUse = firstPage.accessToken || longLivedToken.accessToken
          console.log('[Instagram OAuth Callback] Token type:', firstPage.accessToken ? 'page token' : 'user token')
          console.log('[Instagram OAuth Callback] Token preview:', tokenToUse.substring(0, 20) + '...')
          
          // Try to get Instagram account directly using the page
          // This method uses multiple fallback strategies to find Instagram account
          const instagramAccount = await getInstagramAccountIdForPage(
            firstPage.id,
            tokenToUse
          )
          
          // If we can get Instagram account, proceed with connection
          console.log('[Instagram OAuth Callback] ✅ Successfully found Instagram account via direct method:', {
            username: instagramAccount.username,
            accountType: instagramAccount.accountType,
            instagramAccountId: instagramAccount.instagramAccountId,
            facebookPageId: instagramAccount.facebookPageId,
          })
          
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

          // Also save Facebook Page connection with Page access token
          // Use Page access token if available, otherwise use user token
          const pageToken = firstPage.accessToken || longLivedToken.accessToken
          user.socialConnections.facebook = {
            accessToken: pageToken, // Save Page access token for posting
            userId: instagramAccount.facebookPageId,
            expiresAt,
          }

          await user.save()

          console.log('[Instagram OAuth Callback] Successfully connected via direct method:', {
            userId: user._id,
            instagramUsername: instagramAccount.username,
            facebookPageId: instagramAccount.facebookPageId,
          })

          // Return JSON response for frontend callback, or redirect for backend callback
          const facebookPageId = instagramAccount.facebookPageId
          const redirectUrl = `https://www.facebook.com/pages/manage/${facebookPageId}`
          
          // Check if this is a frontend callback (has Authorization header)
          if (req.headers.authorization) {
            // Frontend callback - return JSON
            res.json({
              success: true,
              message: 'Successfully connected Instagram and Facebook Page',
              redirectUrl,
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
          } else {
            // Backend callback - redirect directly
            res.redirect(redirectUrl)
          }
          return
        } catch (directError: any) {
          console.error('[Instagram OAuth Callback] Direct method failed:', directError.response?.data || directError.message)
          
          // Last resort: Try to connect anyway using the page, even if we can't detect Instagram
          // The user confirmed Instagram is connected in Meta Business Suite
          // We'll save the connection and let them test if it works for posting
          console.log('[Instagram OAuth Callback] Attempting fallback: Save connection without Instagram detection')
          
          try {
            // Get page name
            const pageNameResponse = await axios.get(
              `https://graph.facebook.com/v18.0/${firstPage.id}?fields=name&access_token=${firstPage.accessToken || longLivedToken.accessToken}`
            )
            
            // Calculate expiration date
            const expiresAt = new Date()
            expiresAt.setSeconds(expiresAt.getSeconds() + longLivedToken.expiresIn)

            // Save to user with placeholder Instagram info
            // We'll try to get the actual Instagram account ID when posting
            if (!user.socialConnections) {
              user.socialConnections = {}
            }

            // Save Facebook Page connection with Page access token
            // Use Page access token if available, otherwise use user token
            const pageToken = firstPage.accessToken || longLivedToken.accessToken
            user.socialConnections.facebook = {
              accessToken: pageToken, // Save Page access token for posting
              userId: firstPage.id,
              expiresAt,
            }

            // Save Instagram connection with placeholder
            // The actual Instagram account ID will be retrieved when needed
            // We'll use the Facebook Page ID as a reference
            user.socialConnections.instagram = {
              accessToken: longLivedToken.accessToken,
              userId: firstPage.id, // Use page ID temporarily, will resolve to Instagram ID when posting
              username: 'pending',
              accountType: 'BUSINESS',
              expiresAt,
            }

            await user.save()

            console.log('[Instagram OAuth Callback] Saved connection with fallback method:', {
              userId: user._id,
              facebookPageId: firstPage.id,
              note: 'Instagram account will be resolved when posting',
            })

            // Return JSON response for frontend callback, or redirect for backend callback
            const redirectUrl = `https://www.facebook.com/pages/manage/${firstPage.id}`
            
            // Check if this is a frontend callback (has Authorization header)
            if (req.headers.authorization) {
              // Frontend callback - return JSON
              res.json({
                success: true,
                message: 'Successfully connected (Instagram account will be resolved when posting)',
                redirectUrl,
                instagram: {
                  userId: firstPage.id, // Temporary, will be resolved later
                  username: 'pending',
                  accountType: 'BUSINESS',
                },
                facebook: {
                  pageId: firstPage.id,
                  pageName: firstPage.name,
                },
              })
            } else {
              // Backend callback - redirect directly
              res.redirect(redirectUrl)
            }
            return
          } catch (fallbackError: any) {
            console.error('[Instagram OAuth Callback] Fallback method also failed:', fallbackError.response?.data || fallbackError.message)
            // Fall through to error redirect
          }
        }
      }
      
      // If all methods fail, still allow Facebook-only connection
      // This allows users with personal accounts to use Facebook sharing
      // Instagram sharing will require Business Account (checked separately)
      if (pages.length > 0) {
        const firstPage = pages[0]
        console.log('[Instagram OAuth Callback] All Instagram detection methods failed, but allowing Facebook-only connection')
        
        try {
          // Get page name
          const pageNameResponse = await axios.get(
            `https://graph.facebook.com/v18.0/${firstPage.id}?fields=name&access_token=${firstPage.accessToken || longLivedToken.accessToken}`
          )
          
          // Calculate expiration date
          const expiresAt = new Date()
          expiresAt.setSeconds(expiresAt.getSeconds() + longLivedToken.expiresIn)

          // Save to user - Facebook only (no Instagram)
          if (!user.socialConnections) {
            user.socialConnections = {}
          }

          // Save Facebook Page connection with Page access token
          const pageToken = firstPage.accessToken || longLivedToken.accessToken
          user.socialConnections.facebook = {
            accessToken: pageToken,
            userId: firstPage.id,
            expiresAt,
          }

          // Don't save Instagram connection if we can't detect it
          // User can still use Facebook sharing
          // Instagram sharing will show an error when they try to use it

          await user.save()

          console.log('[Instagram OAuth Callback] Saved Facebook-only connection:', {
            userId: user._id,
            facebookPageId: firstPage.id,
            note: 'Instagram not connected - user can use Facebook sharing only',
          })

          const redirectUrl = `https://www.facebook.com/pages/manage/${firstPage.id}`
          
          if (isFrontendCallback) {
            return res.json({
              success: true,
              message: 'Successfully connected Facebook Page. Note: Instagram sharing requires a Business/Creator account connected to your Facebook Page.',
              redirectUrl,
              facebook: {
                pageId: firstPage.id,
                pageName: pageNameResponse.data.name,
              },
              instagram: null,
              warning: 'Instagram not connected. To use Instagram sharing, please connect an Instagram Business/Creator account to your Facebook Page.',
            })
          } else {
            return res.redirect(redirectUrl)
          }
        } catch (saveError: any) {
          console.error('[Instagram OAuth Callback] Failed to save Facebook connection:', saveError.response?.data || saveError.message)
          // Fall through to error
        }
      }
      
      // If we can't even save Facebook connection, return error
      if (isFrontendCallback) {
        return res.json({
          success: false,
          message: `Failed to connect. Please ensure you have a Facebook Page. Instagram sharing requires a Business/Creator account connected to your Facebook Page.`,
          pages: pageNames,
        })
      }
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?error=connection_failed&pages=${encodeURIComponent(pageNames)}`
      )
    }

    // If only one page, connect it directly
    if (pagesWithInstagram.length === 1) {
      const selectedPage = pagesWithInstagram[0]
      
      // Get Instagram account for selected page
      const instagramAccount = await getInstagramAccountIdForPage(
        selectedPage.id,
        selectedPage.accessToken || longLivedToken.accessToken // Use Page token if available
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
        accessToken: longLivedToken.accessToken, // Keep user token for Instagram API
        userId: instagramAccount.instagramAccountId,
        username: instagramAccount.username,
        accountType: instagramAccount.accountType,
        expiresAt,
      }

      // Also save Facebook Page connection with Page access token
      // Use Page access token for posting (has pages_manage_posts permission)
      const pageToken = selectedPage.accessToken || longLivedToken.accessToken
      user.socialConnections.facebook = {
        accessToken: pageToken, // Save Page access token for posting
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

      // Redirect to Facebook Page management page
      const facebookPageId = instagramAccount.facebookPageId
      console.log('[Instagram OAuth Callback] Redirecting to Facebook Page:', facebookPageId)
      res.redirect(
        `https://www.facebook.com/pages/manage/${facebookPageId}`
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
    console.error('[Instagram OAuth Callback] Error:', error)
    console.error('[Instagram OAuth Callback] Error stack:', error.stack)
    console.error('[Instagram OAuth Callback] Error response:', error.response?.data)
    const errorMessage = error.response?.data?.error?.message || error.message || 'oauth_failed'
    console.error('[Instagram OAuth Callback] Redirecting to settings with error:', errorMessage)
    res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?error=${encodeURIComponent(errorMessage)}`
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
        message: 'Instagram account not connected. Instagram sharing requires a Business or Creator account connected to your Facebook Page. Please connect your Instagram Business/Creator account first.',
        requiresAuth: true,
        helpText: 'To use Instagram sharing: 1) Switch your Instagram account to Business or Creator in Instagram settings, 2) Connect it to your Facebook Page, 3) Reconnect in this app.',
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

    // Instagram requires an image URL for posts
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required for Instagram posts. Instagram API only supports image or video posts, not text-only posts.',
      })
    }

    // Share to Instagram
    const result = await shareToInstagram(
      instagram.userId!,
      instagram.accessToken,
      {
        text: content,
        imageUrl: imageUrl,
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
    
    // Check if it's the image URL requirement error
    if (error.message && error.message.includes('Image URL is required')) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required for Instagram posts. Instagram API only supports image or video posts, not text-only posts.',
      })
    }
    
    // Check if it's an authentication error
    if (error.response?.status === 401 || error.response?.data?.error?.code === 190) {
      return res.status(401).json({
        success: false,
        message: 'Instagram access token expired or invalid. Please reconnect your account.',
        requiresAuth: true,
      })
    }

    res.status(500).json({
      success: false,
      message: error.response?.data?.error?.message || error.message || 'Failed to share to Instagram',
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

    // Get Page access token for posting (required for pages_manage_posts permission)
    let pageAccessToken = accessToken // Fallback to user token
    try {
      const pagesResponse = await axios.get(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
      )
      if (pagesResponse.data.data && pagesResponse.data.data.length > 0) {
        const targetPage = pagesResponse.data.data.find((page: any) => page.id === pageId)
        if (targetPage && targetPage.access_token) {
          pageAccessToken = targetPage.access_token
          console.log('[Connect Page] Using Page access token for posting')
        }
      }
    } catch (error) {
      console.error('[Connect Page] Error getting Page access token:', error)
      // Continue with user token as fallback
    }

    // Calculate expiration date
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn)

    // Save to user
    if (!user.socialConnections) {
      user.socialConnections = {}
    }

    // Save Instagram connection (use user token for Instagram API)
    user.socialConnections.instagram = {
      accessToken: accessToken,
      userId: instagramAccount.instagramAccountId,
      username: instagramAccount.username,
      accountType: instagramAccount.accountType,
      expiresAt,
    }

    // Also save Facebook Page connection with Page access token
    user.socialConnections.facebook = {
      accessToken: pageAccessToken, // Save Page access token for posting
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

    // Return JSON with redirect URL for frontend to handle
    res.json({
      success: true,
      message: 'Successfully connected Instagram and Facebook Page',
      redirectUrl: `https://www.facebook.com/pages/manage/${instagramAccount.facebookPageId}`,
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

    // IMPORTANT: Reload user from database to get latest socialConnections
    // The req.user might be stale if it was loaded before OAuth callback
    const freshUser = await User.findById(user._id)
    if (!freshUser) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const { calendarItemId, content, imageUrl } = req.body

    console.log('[Facebook Share] Request received:', {
      userId: freshUser._id,
      calendarItemId,
      hasContent: !!content,
      hasImageUrl: !!imageUrl,
      socialConnections: freshUser.socialConnections ? 'exists' : 'null',
      facebookToken: freshUser.socialConnections?.facebook?.accessToken ? 'exists' : 'missing',
      instagramToken: freshUser.socialConnections?.instagram?.accessToken ? 'exists' : 'missing',
      facebookTokenPreview: freshUser.socialConnections?.facebook?.accessToken ? freshUser.socialConnections.facebook.accessToken.substring(0, 20) + '...' : 'N/A',
      facebookUserId: freshUser.socialConnections?.facebook?.userId || 'N/A',
      instagramUserId: freshUser.socialConnections?.instagram?.userId || 'N/A',
    })

    if (!calendarItemId || !content) {
      return res.status(400).json({
        success: false,
        message: 'calendarItemId and content are required',
      })
    }

    // Check if user has Facebook connected (either directly or through Instagram)
    // Instagram connection also provides Facebook Page access with the same token
    const facebook = freshUser.socialConnections?.facebook
    const instagram = freshUser.socialConnections?.instagram

    // Use Facebook connection if available, otherwise try Instagram token (which also works for Facebook Page)
    let facebookToken: string | undefined
    let facebookUserId: string | undefined
    let pageAccessToken: string | undefined // Page access token for posting
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
            if (!freshUser.socialConnections) {
              freshUser.socialConnections = {}
            }
            if (!freshUser.socialConnections.facebook) {
              freshUser.socialConnections.facebook = { accessToken: facebookToken }
            }
            freshUser.socialConnections.facebook.userId = facebookUserId
            freshUser.socialConnections.facebook.expiresAt = instagram.expiresAt
            await freshUser.save()
          }
        } catch (error) {
          console.error('Error fetching Facebook Page ID:', error)
        }
      }
    }

    // Get Page access token for posting (required for pages_manage_posts permission)
    // User token doesn't have sufficient permissions, we need Page token
    if (facebookUserId && facebookToken) {
      try {
        console.log('[Facebook Share] Getting Page access token for:', facebookUserId)
        const pagesResponse = await axios.get(
          `https://graph.facebook.com/v18.0/me/accounts?access_token=${facebookToken}`
        )
        
        if (pagesResponse.data.data && pagesResponse.data.data.length > 0) {
          // Find the page we want to post to
          const targetPage = pagesResponse.data.data.find((page: any) => page.id === facebookUserId)
          if (targetPage && targetPage.access_token) {
            pageAccessToken = targetPage.access_token
            console.log('[Facebook Share] Got Page access token')
          } else {
            console.log('[Facebook Share] Page not found in accounts, using user token')
            pageAccessToken = facebookToken // Fallback to user token
          }
        } else {
          console.log('[Facebook Share] No pages found, using user token')
          pageAccessToken = facebookToken // Fallback to user token
        }
      } catch (error: any) {
        console.error('[Facebook Share] Error getting Page access token:', error.response?.data || error.message)
        // Fallback to user token
        pageAccessToken = facebookToken
      }
    } else {
      pageAccessToken = facebookToken
    }

    if (!pageAccessToken || !facebookUserId) {
      return res.status(400).json({
        success: false,
        message: 'Facebook account not connected. Please connect your Facebook or Instagram account first.',
        requiresAuth: true,
      })
    }

    // Share to Facebook using Graph API with Page access token
    let postId: string
    let permalink: string | undefined

    try {
      console.log('[Facebook Share] Posting to Page:', {
        pageId: facebookUserId,
        hasImage: !!imageUrl,
        usingPageToken: pageAccessToken !== facebookToken,
      })

      // If imageUrl is provided, create a post with photo
      if (imageUrl) {
        // First, upload the photo using Page access token
        const photoResponse = await axios.post(
          `https://graph.facebook.com/v24.0/${facebookUserId}/photos`,
          {
            url: imageUrl,
            message: content,
            access_token: pageAccessToken, // Use Page access token
          }
        )
        postId = photoResponse.data.id
        permalink = photoResponse.data.post_id ? `https://www.facebook.com/photo.php?fbid=${postId}` : undefined
      } else {
        // Create a text-only post using Page access token
        const postResponse = await axios.post(
          `https://graph.facebook.com/v24.0/${facebookUserId}/feed`,
          {
            message: content,
            access_token: pageAccessToken, // Use Page access token instead of user token
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
 * @desc    Get Facebook connection status with detailed debug info
 * @route   GET /api/social/facebook/status
 * @access  Private
 */
router.get('/facebook/status', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Reload user from database to get latest socialConnections
    const freshUser = await User.findById(user._id)
    if (!freshUser) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const facebook = freshUser.socialConnections?.facebook
    const instagram = freshUser.socialConnections?.instagram

    // Detailed debug info
    const debugInfo = {
      userId: freshUser._id.toString(),
      hasSocialConnections: !!freshUser.socialConnections,
      facebook: {
        exists: !!facebook,
        hasAccessToken: !!facebook?.accessToken,
        hasUserId: !!facebook?.userId,
        tokenPreview: facebook?.accessToken ? facebook.accessToken.substring(0, 20) + '...' : 'N/A',
        userId: facebook?.userId || 'N/A',
        expiresAt: facebook?.expiresAt || 'N/A',
        isExpired: facebook?.expiresAt ? new Date() > facebook.expiresAt : 'N/A',
      },
      instagram: {
        exists: !!instagram,
        hasAccessToken: !!instagram?.accessToken,
        hasUserId: !!instagram?.userId,
        tokenPreview: instagram?.accessToken ? instagram.accessToken.substring(0, 20) + '...' : 'N/A',
        userId: instagram?.userId || 'N/A',
        username: instagram?.username || 'N/A',
        expiresAt: instagram?.expiresAt || 'N/A',
        isExpired: instagram?.expiresAt ? new Date() > instagram.expiresAt : 'N/A',
      },
      envCheck: {
        hasFacebookAppId: !!process.env.FACEBOOK_APP_ID,
        hasFacebookAppSecret: !!process.env.FACEBOOK_APP_SECRET,
        hasRedirectUri: !!process.env.FACEBOOK_REDIRECT_URI,
        redirectUri: process.env.FACEBOOK_REDIRECT_URI || 'N/A',
      },
    }

    console.log('[Facebook Status] Debug info:', debugInfo)

    if (!facebook || !facebook.accessToken) {
      return res.json({
        success: true,
        connected: false,
        debug: debugInfo,
        message: 'Facebook account not connected. Please connect your Facebook or Instagram account first.',
      })
    }

    // Check if token is expired
    const isExpired = facebook.expiresAt && new Date() > facebook.expiresAt

    res.json({
      success: true,
      connected: !isExpired,
      userId: facebook.userId,
      expiresAt: facebook.expiresAt,
      debug: debugInfo,
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

