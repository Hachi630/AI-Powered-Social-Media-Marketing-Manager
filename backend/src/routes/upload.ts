import express, { Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs'
import { protect } from '../middleware/auth'
import { AuthRequest } from '../types'
import { saveImage } from '../utils/imageStorage'
import { saveMediaFile } from '../services/databaseService'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = express.Router()

const UPLOADS_DIR = path.join(__dirname, '../../uploads/images')
const FILES_DIR = path.join(__dirname, '../../uploads/files')

// Ensure uploads directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}
if (!fs.existsSync(FILES_DIR)) {
  fs.mkdirSync(FILES_DIR, { recursive: true })
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR)
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const ext = path.extname(file.originalname) || '.png'
    cb(null, `${timestamp}-${random}${ext}`)
  },
})

// File filter - only allow images
const imageFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed'))
  }
}

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
})

// @desc    Upload image (multipart/form-data)
// @route   POST /api/upload/image
// @access  Private
router.post('/image', protect, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' })
    }

    const imageUrl = `/uploads/images/${req.file.filename}`
    
    // Generate absolute URL for external access (needed for Ayrshare)
    const backendUrl = process.env.BACKEND_URL || 
                      process.env.SERVER_URL || 
                      `http://localhost:${process.env.PORT || 5000}`
    const absoluteImageUrl = `${backendUrl}${imageUrl}`

    // Save to database
    try {
      await saveMediaFile({
        userId: user._id,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileUrl: imageUrl,
        fileType: 'image',
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
      })
    } catch (dbError) {
      console.error("Failed to save uploaded image to database:", dbError)
      // Don't fail the request if DB save fails
    }

    res.json({
      success: true,
      imageUrl, // Relative URL for frontend
      absoluteUrl: absoluteImageUrl, // Absolute URL for external services like Ayrshare
    })
  } catch (error: any) {
    console.error('Upload image error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image',
    })
  }
})

// @desc    Upload image (base64)
// @route   POST /api/upload/image-base64
// @access  Private
router.post('/image-base64', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const { imageData, mimeType } = req.body

    if (!imageData) {
      return res.status(400).json({ success: false, message: 'Image data is required' })
    }

    // Extract base64 data (remove data URL prefix if present)
    let base64Data = imageData
    let finalMimeType = mimeType || 'image/png'

    if (imageData.includes(',')) {
      const [header, data] = imageData.split(',')
      base64Data = data
      const mimeMatch = header.match(/data:([^;]+)/)
      if (mimeMatch) {
        finalMimeType = mimeMatch[1]
      }
    }

    const imageUrl = await saveImage(base64Data, finalMimeType)

    // Save to database
    try {
      const fileName = imageUrl.split('/').pop() || 'uploaded-image.png'
      const filePath = path.join(UPLOADS_DIR, fileName)
      
      await saveMediaFile({
        userId: user._id,
        fileName: fileName,
        originalName: 'uploaded-image.png',
        filePath: filePath,
        fileUrl: imageUrl,
        fileType: 'image',
        mimeType: finalMimeType,
        fileSize: Buffer.from(base64Data, 'base64').length,
      })
    } catch (dbError) {
      console.error("Failed to save uploaded image to database:", dbError)
      // Don't fail the request if DB save fails
    }

    res.json({
      success: true,
      imageUrl,
    })
  } catch (error: any) {
    console.error('Upload image (base64) error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image',
    })
  }
})

// Configure multer storage for files
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, FILES_DIR)
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const ext = path.extname(file.originalname) || ''
    const originalName = path.basename(file.originalname, ext)
    // Preserve original filename (sanitized) with timestamp
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_')
    cb(null, `${timestamp}-${sanitizedName}${ext}`)
  },
})

// File filter for documents and media
const documentFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow images, videos, and documents
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/') ||
    file.mimetype.startsWith('audio/') ||
    [
      // PDF
      'application/pdf',
      // Word
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // PowerPoint
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Excel
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // Text
      'text/plain',
      // Other common types
      'application/rtf',
      'text/csv',
    ].includes(file.mimetype)
  ) {
    cb(null, true)
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`))
  }
}

const fileUpload = multer({
  storage: fileStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit (Twilio MMS supports up to 5MB, but we allow larger for storage)
  },
})

// @desc    Upload file (multipart/form-data)
// @route   POST /api/upload/file
// @access  Private
router.post('/file', protect, fileUpload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' })
    }

    const fileUrl = `/uploads/files/${req.file.filename}`

    // Determine file type
    let fileType: 'image' | 'video' | 'document' | 'audio' = 'document'
    if (req.file.mimetype.startsWith('image/')) {
      fileType = 'image'
    } else if (req.file.mimetype.startsWith('video/')) {
      fileType = 'video'
    } else if (req.file.mimetype.startsWith('audio/')) {
      fileType = 'audio'
    }

    // Save to database
    try {
      await saveMediaFile({
        userId: user._id,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileUrl: fileUrl,
        fileType: fileType,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
      })
    } catch (dbError) {
      console.error("Failed to save uploaded file to database:", dbError)
      // Don't fail the request if DB save fails
    }

    res.json({
      success: true,
      fileUrl,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
    })
  } catch (error: any) {
    console.error('Upload file error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload file',
    })
  }
})

export default router

