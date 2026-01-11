import express, { Request, Response } from 'express'
import { protect } from '../middleware/auth.js'
import { AuthRequest } from '../types/index.js'
import CalendarItem from '../models/CalendarItem.js'
import { twitterService } from '../services/twitterService.js'
import TwitterToken from '../models/TwitterToken.js'
import LinkedInToken from '../models/LinkedInToken.js'
import {
  createLinkedInPost,
  createLinkedInPostWithImage,
  initializeImageUpload,
  uploadImageToLinkedIn,
} from '../services/linkedinService.js'
import { shareToFacebook } from '../services/facebookService.js'
import User from '../models/User.js'
import { readImageAsBase64 } from '../utils/imageReader.js'
import axios from 'axios'
import { checkAndPublishScheduledItems } from '../services/schedulerService.js'

const router = express.Router()

/**
 * Get image buffer from imageUrl (handles both local paths and URLs)
 */
async function getImageBuffer(imageUrl: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  // Check if it's a URL (starts with http:// or https://)
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout
      });
      
      const buffer = Buffer.from(response.data);
      const contentType = response.headers['content-type'] || 'image/jpeg';
      
      return { buffer, contentType };
    } catch (error: any) {
      console.error('Failed to download image from URL:', imageUrl, error.message);
      return null;
    }
  }
  
  // Otherwise, treat it as a local file path
  const imageData = readImageAsBase64(imageUrl);
  if (!imageData.success || !imageData.base64) {
    console.error('Failed to read local image:', imageData.error);
    return null;
  }
  
  const buffer = Buffer.from(imageData.base64, 'base64');
  return { buffer, contentType: imageData.mimeType };
}

// @desc    Get calendar items for date range
// @route   GET /api/calendar
// @access  Private
router.get('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      })
    }

    const start = new Date(startDate as string)
    const end = new Date(endDate as string)

    // Set end date to end of day
    end.setHours(23, 59, 59, 999)

    const items = await CalendarItem.find({
      userId: user._id,
      date: {
        $gte: start,
        $lte: end,
      },
    })
      .populate('campaignId', 'name')
      .sort({ date: 1, time: 1 })

    res.json({
      success: true,
      items: items.map((item) => ({
        id: item._id.toString(),
        userId: item.userId.toString(),
        campaignId: item.campaignId ? item.campaignId.toString() : null,
        campaignName: (item.campaignId as any)?.name || null,
        companyId: item.companyId || null,
        platform: item.platform,
        date: item.date.toISOString().split('T')[0],
        time: item.time || null,
        title: item.title,
        content: item.content,
        imageUrl: item.imageUrl || null,
        variants: item.variants || {},
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    })
  } catch (error: any) {
    console.error('Get calendar items error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get calendar items',
    })
  }
})

// @desc    Get single calendar item
// @route   GET /api/calendar/:id
// @access  Private
router.get('/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const item = await CalendarItem.findOne({
      _id: req.params.id,
      userId: user._id,
    }).populate('campaignId', 'name')

    if (!item) {
      return res.status(404).json({ success: false, message: 'Calendar item not found' })
    }

    res.json({
      success: true,
      item: {
        id: item._id.toString(),
        userId: item.userId.toString(),
        campaignId: item.campaignId ? item.campaignId.toString() : null,
        campaignName: (item.campaignId as any)?.name || null,
        companyId: item.companyId || null,
        platform: item.platform,
        date: item.date.toISOString().split('T')[0],
        time: item.time || null,
        title: item.title,
        content: item.content,
        imageUrl: item.imageUrl || null,
        variants: item.variants || {},
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
    })
  } catch (error: any) {
    console.error('Get calendar item error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get calendar item',
    })
  }
})

// @desc    Create calendar item
// @route   POST /api/calendar
// @access  Private
router.post('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const {
      campaignId,
      companyId,
      platform,
      date,
      time,
      title,
      content,
      imageUrl,
      variants,
      status,
    } = req.body

    // Validate required fields
    if (!platform || !date || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'platform, date, title, and content are required',
      })
    }

    const item = await CalendarItem.create({
      userId: user._id,
      campaignId: campaignId || null,
      companyId: companyId || null,
      platform,
      date: new Date(date),
      time: time || null,
      title,
      content,
      imageUrl: imageUrl || null,
      variants: variants || {},
      status: status || 'draft',
    })

    res.status(201).json({
      success: true,
      item: {
        id: item._id.toString(),
        userId: item.userId.toString(),
        campaignId: item.campaignId ? item.campaignId.toString() : null,
        companyId: item.companyId || null,
        platform: item.platform,
        date: item.date.toISOString().split('T')[0],
        time: item.time || null,
        title: item.title,
        content: item.content,
        imageUrl: item.imageUrl || null,
        variants: item.variants || {},
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
    })
  } catch (error: any) {
    console.error('Create calendar item error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create calendar item',
    })
  }
})

// @desc    Update calendar item
// @route   PUT /api/calendar/:id
// @access  Private
router.put('/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const item = await CalendarItem.findOne({
      _id: req.params.id,
      userId: user._id,
    })

    if (!item) {
      return res.status(404).json({ success: false, message: 'Calendar item not found' })
    }

    const {
      campaignId,
      companyId,
      platform,
      date,
      time,
      title,
      content,
      imageUrl,
      variants,
      status,
    } = req.body

    // Update fields
    if (campaignId !== undefined) item.campaignId = campaignId || null
    if (companyId !== undefined) item.companyId = companyId || null
    if (platform !== undefined) item.platform = platform
    if (date !== undefined) item.date = new Date(date)
    if (time !== undefined) item.time = time || null
    if (title !== undefined) item.title = title
    if (content !== undefined) item.content = content
    if (imageUrl !== undefined) item.imageUrl = imageUrl || null
    if (variants !== undefined) item.variants = variants || {}
    if (status !== undefined) item.status = status

    await item.save()

    res.json({
      success: true,
      item: {
        id: item._id.toString(),
        userId: item.userId.toString(),
        campaignId: item.campaignId ? item.campaignId.toString() : null,
        companyId: item.companyId || null,
        platform: item.platform,
        date: item.date.toISOString().split('T')[0],
        time: item.time || null,
        title: item.title,
        content: item.content,
        imageUrl: item.imageUrl || null,
        variants: item.variants || {},
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
    })
  } catch (error: any) {
    console.error('Update calendar item error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update calendar item',
    })
  }
})

// @desc    Delete calendar item
// @route   DELETE /api/calendar/:id
// @access  Private
router.delete('/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const item = await CalendarItem.findOneAndDelete({
      _id: req.params.id,
      userId: user._id,
    })

    if (!item) {
      return res.status(404).json({ success: false, message: 'Calendar item not found' })
    }

    res.json({
      success: true,
      message: 'Calendar item deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete calendar item error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete calendar item',
    })
  }
})

// @desc    Batch create calendar items
// @route   POST /api/calendar/batch
// @access  Private
router.post('/batch', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const { items } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'items array is required and must not be empty',
      })
    }

    // Validate and create items
    const itemsToCreate = items.map((item: any) => ({
      userId: user._id,
      campaignId: item.campaignId || null,
      companyId: item.companyId || null,
      platform: item.platform,
      date: new Date(item.date),
      time: item.time || null,
      title: item.title,
      content: item.content,
      imageUrl: item.imageUrl || null,
      variants: item.variants || {},
      status: item.status || 'draft',
    }))

    const createdItems = await CalendarItem.insertMany(itemsToCreate)

    res.status(201).json({
      success: true,
      items: createdItems.map((item) => ({
        id: item._id.toString(),
        userId: item.userId.toString(),
        campaignId: item.campaignId ? item.campaignId.toString() : null,
        companyId: item.companyId || null,
        platform: item.platform,
        date: item.date.toISOString().split('T')[0],
        time: item.time || null,
        title: item.title,
        content: item.content,
        imageUrl: item.imageUrl || null,
        variants: item.variants || {},
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      count: createdItems.length,
    })
  } catch (error: any) {
    console.error('Batch create calendar items error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create calendar items',
    })
  }
})

export default router

// @desc    Share calendar item to platform
// @route   POST /api/calendar/:id/share
// @access  Private
router.post('/:id/share', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const { platform } = req.body

    if (!platform) {
      return res.status(400).json({ success: false, message: 'Platform is required' })
    }

    const item = await CalendarItem.findOne({
      _id: req.params.id,
      userId: user._id,
    })

    if (!item) {
      return res.status(404).json({ success: false, message: 'Calendar item not found' })
    }

    // Currently only Twitter is supported for direct posting
    if (platform === 'twitter') {
      // Check if user has connected their Twitter account
      const twitterToken = await TwitterToken.findOne({ userId: user._id });
      
      if (!twitterToken || !twitterToken.accessToken || !twitterToken.accessSecret) {
        return res.status(401).json({
          success: false,
          message: 'Twitter account not connected. Please connect your Twitter account first.',
          requiresAuth: true
        });
      }

      // Check if item has content variant for Twitter
      let content = item.variants?.twitter || item.content;
      
      // Post to Twitter using user's tokens
      const result = await twitterService.postTweet(
        content, 
        item.imageUrl,
        twitterToken.accessToken,
        twitterToken.accessSecret
      );
      
      if (result.success) {
        // Update item status to published if successful
        item.status = 'published';
        await item.save();
        
        return res.json({
          success: true,
          message: 'Successfully posted to Twitter',
          tweetId: result.tweetId
        });
      } else {
        // Return detailed error information
        const errorMessage = result.error?.data?.detail || 
                            result.error?.errors?.[0]?.message || 
                            result.error?.message || 
                            'Failed to post to Twitter';
        const errorCode = result.error?.code;
        
        console.error('Twitter posting failed:', {
          message: errorMessage,
          code: errorCode,
          fullError: result.error
        });
        
        return res.status(500).json({
          success: false,
          message: errorMessage,
          code: errorCode,
          details: result.error?.data || result.error?.errors
        });
      }
    } else if (platform === 'linkedin') {
      // Check if user has connected their LinkedIn account
      const linkedInToken = await LinkedInToken.findOne({ userId: user._id });
      
      if (!linkedInToken || !linkedInToken.accessToken || !linkedInToken.liMemberId) {
        return res.status(401).json({
          success: false,
          message: 'LinkedIn account not connected. Please connect your LinkedIn account first.',
          requiresAuth: true
        });
      }
      
      // Check if token is expired
      if (linkedInToken.expiresAt && new Date(linkedInToken.expiresAt) < new Date()) {
        return res.status(401).json({
          success: false,
          message: 'LinkedIn token has expired. Please reconnect your LinkedIn account.',
          requiresAuth: true
        });
      }
      
      // Check if item has content variant for LinkedIn
      let content = item.variants?.linkedin || item.content;
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Content is required for LinkedIn post'
        });
      }
      
      // Determine if posting to organization or personal
      // Validate companyId - it should be a numeric string (LinkedIn organization ID)
      // If companyId exists but is invalid, fall back to personal account
      let isOrganization = false;
      let authorId = linkedInToken.liMemberId;
      
      if (item.companyId && item.companyId.trim().length > 0) {
        // LinkedIn organization IDs are numeric strings
        // Validate that companyId looks like a valid LinkedIn org ID (numeric)
        const companyIdStr = item.companyId.trim();
        if (/^\d+$/.test(companyIdStr)) {
          isOrganization = true;
          authorId = companyIdStr;
          console.log(`[Calendar Share] Posting to organization: ${authorId}`);
        } else {
          console.warn(`[Calendar Share] Invalid companyId format: "${companyIdStr}". Expected numeric LinkedIn organization ID. Falling back to personal account.`);
          // Fall back to personal account
          isOrganization = false;
          authorId = linkedInToken.liMemberId;
        }
      } else {
        console.log(`[Calendar Share] Posting to personal account: ${authorId}`);
      }
      
      // Validate authorId is not empty
      if (!authorId || authorId.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid author ID. Please reconnect your LinkedIn account.'
        });
      }
      
      let result;
      
      // Handle image if present
      if (item.imageUrl) {
        try {
          // Get image buffer
          const imageData = await getImageBuffer(item.imageUrl);
          
          if (!imageData) {
            // Post without image if image fails
            result = await createLinkedInPost(
              linkedInToken.accessToken,
              authorId,
              content,
              isOrganization
            );
          } else {
            // Initialize image upload
            const uploadInit = await initializeImageUpload(
              linkedInToken.accessToken,
              authorId,
              isOrganization
            );
            
            if (!uploadInit.success || !uploadInit.uploadUrl || !uploadInit.imageUrn) {
              // Post without image if upload init fails
              result = await createLinkedInPost(
                linkedInToken.accessToken,
                authorId,
                content,
                isOrganization
              );
            } else {
              // Upload image
              const uploadResult = await uploadImageToLinkedIn(
                uploadInit.uploadUrl,
                imageData.buffer,
                imageData.contentType
              );
              
              if (!uploadResult.success) {
                // Post without image if upload fails
                result = await createLinkedInPost(
                  linkedInToken.accessToken,
                  authorId,
                  content,
                  isOrganization
                );
              } else {
                // Post with image
                result = await createLinkedInPostWithImage(
                  linkedInToken.accessToken,
                  authorId,
                  content,
                  uploadInit.imageUrn,
                  isOrganization
                );
              }
            }
          }
        } catch (error: any) {
          console.error('Error handling image for LinkedIn post:', error);
          // Post without image if any image-related error occurs
          result = await createLinkedInPost(
            linkedInToken.accessToken,
            authorId,
            content,
            isOrganization
          );
        }
      } else {
        // Post without image
        result = await createLinkedInPost(
          linkedInToken.accessToken,
          authorId,
          content,
          isOrganization
        );
      }
      
      if (result.success) {
        // Update item status to published if successful
        item.status = 'published';
        await item.save();
        
        return res.json({
          success: true,
          message: 'Successfully posted to LinkedIn',
          postId: result.postId
        });
      } else {
        const errorMessage = result.error || 'Failed to post to LinkedIn';
        
        console.error('LinkedIn posting failed:', {
          message: errorMessage,
          fullError: result.error
        });
        
        return res.status(500).json({
          success: false,
          message: errorMessage,
          details: result.error
        });
      }
    } else if (platform === 'facebook') {
      // Reload user from database to get latest socialConnections
      const freshUser = await User.findById(user._id);
      
      if (!freshUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Check if user has Facebook connected
      const facebook = freshUser.socialConnections?.facebook;

      if (!facebook?.accessToken || !facebook?.userId) {
        return res.status(401).json({
          success: false,
          message: 'Facebook account not connected. Please connect your Facebook Page first.',
          requiresAuth: true
        });
      }

      // Check if token is expired
      if (facebook.expiresAt && new Date() > facebook.expiresAt) {
        return res.status(401).json({
          success: false,
          message: 'Facebook access token expired. Please reconnect your account.',
          requiresAuth: true
        });
      }

      // Check if item has content variant for Facebook
      let content = item.variants?.facebook || item.content;
      
      try {
        // Share to Facebook using Graph API
        const result = await shareToFacebook(facebook.userId, facebook.accessToken, {
          text: content,
          imageUrl: item.imageUrl || undefined,
        });
        
        // Update item status to published if successful
        item.status = 'published';
        await item.save();
        
        return res.json({
          success: true,
          message: 'Successfully posted to Facebook',
          postId: result.postId,
          permalink: result.permalink
        });
      } catch (error: any) {
        console.error('Facebook posting failed:', error);
        
        // Check if it's an authentication error
        if (
          error.response?.status === 401 ||
          error.response?.data?.error?.code === 190
        ) {
          return res.status(401).json({
            success: false,
            message: 'Facebook access token expired or invalid. Please reconnect your account.',
            requiresAuth: true
          });
        }
        
        const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to post to Facebook';
        
        return res.status(500).json({
          success: false,
          message: errorMessage,
          details: error.response?.data
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: `Posting to ${platform} is not yet supported`
      });
    }

  } catch (error: any) {
    console.error('Share calendar item error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to share calendar item',
    })
  }
})

/**
 * Test endpoint to manually trigger the LinkedIn scheduler
 * GET /api/calendar/test-scheduler
 */
router.get('/test-scheduler', protect, async (req: AuthRequest, res: Response) => {
  try {
    console.log('[Test Endpoint] Manual scheduler trigger requested by user:', req.user?._id);
    
    // Run the scheduler check
    await checkAndPublishScheduledItems();
    
    res.json({
      success: true,
      message: 'Scheduler check completed. Check server logs for details.',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Test Endpoint] Error in test-scheduler:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to run scheduler check',
      error: error.stack,
    });
  }
})
