import express, { Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs'
import { protect } from '../middleware/auth.js'
import { AuthRequest } from '../types/index.js'
import { saveImage } from '../utils/imageStorage.js'
import { saveMediaFile } from '../services/databaseService.js'
import { uploadToS3, isS3Configured, getS3PublicUrl } from '../services/s3Service.js'

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

    let imageUrl: string
    let filePath: string
    let storageProvider: 'local' | 's3' | 'cloudinary' = 'local'
    let storageBucket: string | undefined
    let storageKey: string | undefined

    // If S3 is configured, try uploading to S3
    if (isS3Configured() && req.file) {
      try {
        const fileBuffer = fs.readFileSync(req.file.path)
        const result = await uploadToS3(
          fileBuffer,
          req.file.filename,
          req.file.mimetype,
          'images',
          user._id.toString(),
          false // Default private, change to true if public access is needed
        )
        imageUrl = getS3PublicUrl(result.key)
        filePath = `s3://${result.bucket}/${result.key}`
        storageProvider = 's3'
        storageBucket = result.bucket
        storageKey = result.key
        
        // Delete local temporary file
        fs.unlinkSync(req.file.path)
      } catch (s3Error) {
        console.error('S3 upload failed, using local storage:', s3Error)
        // Fall back to local storage
        imageUrl = `/uploads/images/${req.file.filename}`
        filePath = req.file.path
      }
    } else {
      // Use local storage
      imageUrl = `/uploads/images/${req.file.filename}`
      filePath = req.file.path
    }

    // Generate absolute URL for external access (needed for Ayrshare)
    let absoluteImageUrl: string
    if (imageUrl.startsWith('http')) {
      // S3 URL is already an absolute URL
      absoluteImageUrl = imageUrl
    } else {
      // Local URL, need to add backend address
      const backendUrl = process.env.BACKEND_URL ||
        process.env.SERVER_URL ||
        `http://localhost:${process.env.PORT || 5000}`
      absoluteImageUrl = `${backendUrl}${imageUrl}`
    }

    // Save to database
    try {
      await saveMediaFile({
        userId: user._id,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        filePath: filePath,
        fileUrl: imageUrl,
        fileType: 'image',
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        storageProvider,
        storageBucket,
        storageKey,
      })
    } catch (dbError) {
      console.error("Failed to save uploaded image to database:", dbError)
      // Don't fail the request if DB save fails
    }

    res.json({
      success: true,
      imageUrl, // Relative URL for frontend (or S3 URL)
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

    const imageUrl = await saveImage(base64Data, finalMimeType, user._id.toString(), 'images', false)

    // Save to database
    try {
      const fileName = imageUrl.includes('/') ? imageUrl.split('/').pop() || 'uploaded-image.png' : 'uploaded-image.png'
      let filePath: string
      let storageProvider: 'local' | 's3' | 'cloudinary' = 'local'
      let storageBucket: string | undefined
      let storageKey: string | undefined

      // Detect storage type
      if (imageUrl.startsWith('https://') && imageUrl.includes('.s3.')) {
        // S3 URL
        filePath = imageUrl.replace('https://', 's3://').replace(/\.s3\.[^\/]+\.amazonaws\.com\//, '/')
        storageProvider = 's3'
        const urlMatch = imageUrl.match(/https:\/\/([^\.]+)\.s3\.([^\.]+)\.amazonaws\.com\/(.+)/)
        if (urlMatch) {
          storageBucket = urlMatch[1]
          storageKey = urlMatch[3]
        }
      } else {
        // Local file
        filePath = path.join(UPLOADS_DIR, fileName)
      }

      await saveMediaFile({
        userId: user._id,
        fileName: fileName,
        originalName: 'uploaded-image.png',
        filePath: filePath,
        fileUrl: imageUrl,
        fileType: 'image',
        mimeType: finalMimeType,
        fileSize: Buffer.from(base64Data, 'base64').length,
        storageProvider,
        storageBucket,
        storageKey,
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
      // Database files
      'application/x-sql',
      'application/sql',
      'text/x-sql',
      'application/x-sqlite3',
      'application/x-sqlite',
      'application/vnd.sqlite3',
      'application/x-db',
      'application/octet-stream', // For .db, .sqlite files that may not have specific MIME type
    ].includes(file.mimetype) ||
    // Also check file extension for database files (in case MIME type is not recognized)
    /\.(sql|db|sqlite|sqlite3)$/i.test(file.originalname)
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

// @desc    Upload file (multipart/form-data) - For Brand Profile file uploads
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

    let fileUrl: string
    let filePath: string
    let storageProvider: 'local' | 's3' | 'cloudinary' = 'local'
    let storageBucket: string | undefined
    let storageKey: string | undefined

    // If S3 is configured, try uploading to S3 (Brand Profile files)
    if (isS3Configured() && req.file) {
      try {
        const fileBuffer = fs.readFileSync(req.file.path)
        const result = await uploadToS3(
          fileBuffer,
          req.file.filename,
          req.file.mimetype,
          'brand-profile', // Brand Profile files are stored in brand-profile folder
          user._id.toString(),
          false // Brand Profile files are private access
        )
        fileUrl = getS3PublicUrl(result.key) // Use public URL (if private is needed, can use presigned URL)
        filePath = `s3://${result.bucket}/${result.key}`
        storageProvider = 's3'
        storageBucket = result.bucket
        storageKey = result.key
        
        // Delete local temporary file
        fs.unlinkSync(req.file.path)
      } catch (s3Error) {
        console.error('S3 upload failed, using local storage:', s3Error)
        // Fall back to local storage
        fileUrl = `/uploads/files/${req.file.filename}`
        filePath = req.file.path
      }
    } else {
      // Use local storage
      fileUrl = `/uploads/files/${req.file.filename}`
      filePath = req.file.path
    }

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
        filePath: filePath,
        fileUrl: fileUrl,
        fileType: fileType,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        storageProvider,
        storageBucket,
        storageKey,
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

