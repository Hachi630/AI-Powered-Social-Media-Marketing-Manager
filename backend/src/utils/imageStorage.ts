import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { uploadToS3, isS3Configured, getS3PublicUrl } from '../services/s3Service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const UPLOADS_DIR = path.join(__dirname, '../../uploads/images')

/**
 * Ensure uploads directory exists
 */
function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }
}

/**
 * Save base64 image to file system or S3
 * @param base64Data Base64 encoded image data (without data URL prefix)
 * @param mimeType MIME type of the image (e.g., 'image/png', 'image/jpeg')
 * @param userId User ID (optional, for organizing files in S3)
 * @param folder Folder path (default 'images')
 * @param isPublic Whether the file should be publicly accessible (default false)
 * @returns URL path to the saved image (S3 URL or local path)
 */
export async function saveImage(
  base64Data: string,
  mimeType: string,
  userId?: string,
  folder: string = 'images',
  isPublic: boolean = false
): Promise<string> {
  // Determine file extension from MIME type
  const ext = mimeType === 'image/jpeg' || mimeType === 'image/jpg' ? 'jpg' : 'png'

  // Generate unique filename
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const filename = `${timestamp}-${random}.${ext}`

  // If S3 is configured, try uploading to S3
  if (isS3Configured()) {
    try {
      const buffer = Buffer.from(base64Data, 'base64')
      const result = await uploadToS3(buffer, filename, mimeType, folder, userId, isPublic)
      
      // If public file, return public URL; otherwise return S3 key (can be accessed via presigned URL later)
      return isPublic ? result.url : getS3PublicUrl(result.key)
    } catch (error) {
      console.error('S3 upload failed, falling back to local storage:', error)
      // If S3 fails, fall back to local storage
    }
  }

  // Local storage (fallback)
  ensureUploadsDir()

  const filePath = path.join(UPLOADS_DIR, filename)

  // Convert base64 to buffer and save
  const buffer = Buffer.from(base64Data, 'base64')
  fs.writeFileSync(filePath, buffer)

  // Return URL path
  return `/uploads/images/${filename}`
}

