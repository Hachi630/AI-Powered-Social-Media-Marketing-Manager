import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { postToAyrshare, uploadMediaToAyrshare } from '../services/ayrshareService'
import { saveSocialMediaPost } from '../services/databaseService'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import multer from 'multer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = Router()

// Ensure temp directory exists
const tempDir = path.join(__dirname, '../../uploads/temp')
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true })
}

// Multer config for temporary file uploads
const upload = multer({ 
  dest: tempDir,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
})

// @desc    Upload media to Ayrshare and get public URL
// @route   POST /api/ayrshare/upload-media
// @access  Private

router.post('/upload-media', requireAuth, upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
      })
    }
    
    const fileBuffer = fs.readFileSync(req.file.path)
    const fileName = req.file.originalname || req.file.filename
    const mimeType = req.file.mimetype || 'image/jpeg'
    
    console.log(`[Ayrshare Upload] Uploading file: ${fileName}, size: ${fileBuffer.length} bytes, mimeType: ${mimeType}`)
    
    const result = await uploadMediaToAyrshare(fileBuffer, fileName, mimeType)
    
    // Clean up temp file
    try {
      fs.unlinkSync(req.file.path)
    } catch (unlinkError) {
      console.warn('Failed to delete temp file:', unlinkError)
    }
    
    if (result.success) {
      res.json({
        success: true,
        url: result.url,
      })
    } else {
      res.status(500).json({
        success: false,
        message: result.error || 'Failed to upload media to Ayrshare',
      })
    }
  } catch (error: any) {
    // Clean up temp file on error
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path)
      } catch (unlinkError) {
        console.warn('Failed to delete temp file on error:', unlinkError)
      }
    }
    console.error('Ayrshare upload media error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload media',
    })
  }
})

// @desc    Post to multiple platforms via Ayrshare
// @route   POST /api/ayrshare/post
// @access  Private
router.post('/post', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user._id
    const { post, platforms, mediaUrls, scheduleDate } = req.body
    
    if (!post || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Post content and platforms are required',
      })
    }
    
    // Validate platforms
    const validPlatforms = ['facebook', 'twitter', 'instagram', 'linkedin']
    const invalidPlatforms = platforms.filter((p: string) => !validPlatforms.includes(p.toLowerCase()))
    if (invalidPlatforms.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid platforms: ${invalidPlatforms.join(', ')}. Valid platforms are: ${validPlatforms.join(', ')}`,
      })
    }
    
    // Normalize platforms to lowercase
    const normalizedPlatforms = platforms.map((p: string) => p.toLowerCase())
    
    // Process media URLs - upload local files to Ayrshare if needed
    let processedMediaUrls = mediaUrls
    if (processedMediaUrls && processedMediaUrls.length > 0) {
      processedMediaUrls = await Promise.all(
        processedMediaUrls.map(async (url: string) => {
          // If it's already a full public URL (not localhost), use it as is
          if (url.startsWith('https://') && !url.includes('localhost')) {
            return url
          }
          
          // If it's a localhost URL or relative path, upload to Ayrshare
          if (url.includes('localhost') || url.startsWith('/uploads/')) {
            try {
              // Extract file path
              let filePath: string
              if (url.startsWith('/uploads/')) {
                // Relative path - construct full path
                filePath = path.join(process.cwd(), url)
              } else if (url.includes('localhost')) {
                // Extract path from localhost URL
                const urlPath = new URL(url).pathname
                filePath = path.join(process.cwd(), urlPath)
              } else {
                filePath = url
              }
              
              // Check if file exists
              if (!fs.existsSync(filePath)) {
                console.error(`[Ayrshare Route] File not found: ${filePath}`)
                return url // Return original URL if file not found
              }
              
              // Read file
              const fileBuffer = fs.readFileSync(filePath)
              const fileName = path.basename(filePath)
              const mimeType = url.match(/\.(jpg|jpeg)$/i) ? 'image/jpeg' :
                              url.match(/\.(png)$/i) ? 'image/png' :
                              url.match(/\.(gif)$/i) ? 'image/gif' :
                              'image/jpeg'
              
              console.log(`[Ayrshare Route] Uploading media to Ayrshare: ${fileName}`)
              
              // Upload to Ayrshare
              const uploadResult = await uploadMediaToAyrshare(fileBuffer, fileName, mimeType)
              
              if (uploadResult.success && uploadResult.url) {
                console.log(`[Ayrshare Route] Media uploaded successfully: ${uploadResult.url}`)
                return uploadResult.url
              } else {
                console.error(`[Ayrshare Route] Failed to upload media: ${uploadResult.error}`)
                return url // Return original URL if upload fails
              }
            } catch (error: any) {
              console.error(`[Ayrshare Route] Error processing media URL ${url}:`, error)
              return url // Return original URL on error
            }
          }
          
          return url
        })
      )
    }
    
    console.log('[Ayrshare Route] Posting with:', {
      postLength: post.length,
      platforms: normalizedPlatforms,
      mediaUrlsCount: processedMediaUrls?.length || 0,
      mediaUrls: processedMediaUrls,
    })
    
    // Post to Ayrshare
    const result = await postToAyrshare({
      post,
      platforms: normalizedPlatforms,
      mediaUrls: processedMediaUrls,
      scheduleDate,
    })
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || 'Failed to post via Ayrshare',
      })
    }
    
    // Save posts to database for each platform
    const savedPosts = []
    for (const platform of platforms) {
      const platformLower = platform.toLowerCase()
      const platformPostId = result.postIds?.[platformLower] || result.id
      const postUrl = result.urls?.[platformLower]
      
      try {
        const savedPost = await saveSocialMediaPost({
          userId,
          platform: platformLower as 'facebook' | 'twitter' | 'instagram' | 'linkedin',
          postType: mediaUrls && mediaUrls.length > 0 ? 'image' : 'text',
          content: post,
          mediaAttachments: mediaUrls?.map((url: string) => ({
            type: 'image',
            url,
          })) || [],
          platformPostId: platformPostId,
          status: scheduleDate ? 'scheduled' : 'published',
          publishedAt: scheduleDate ? new Date(scheduleDate) : new Date(),
        })
        savedPosts.push({
          platform: platformLower,
          postId: savedPost._id.toString(),
          platformPostId: platformPostId,
          url: postUrl,
        })
      } catch (dbError: any) {
        console.error(`Failed to save ${platformLower} post to database:`, dbError)
        // Continue even if DB save fails
      }
    }
    
    res.json({
      success: true,
      message: `Post published to ${platforms.length} platform(s)`,
      data: {
        ayrshareId: result.id,
        postIds: result.postIds,
        urls: result.urls,
        status: result.status,
        savedPosts,
      },
    })
  } catch (error: any) {
    console.error('Ayrshare post route error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to post via Ayrshare',
    })
  }
})

export default router

