import express, { Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs'
import { protect } from '../middleware/auth'
import { AuthRequest } from '../types'
import { saveImage } from '../utils/imageStorage'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = express.Router()

const UPLOADS_DIR = path.join(__dirname, '../../uploads/images')

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
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
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed'))
  }
}

const upload = multer({
  storage,
  fileFilter,
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

    res.json({
      success: true,
      imageUrl,
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

export default router

