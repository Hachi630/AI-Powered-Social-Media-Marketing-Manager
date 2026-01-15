import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || ''

export interface UploadResult {
  url: string
  key: string
  bucket: string
}

/**
 * Upload file to S3
 * @param fileBuffer File buffer
 * @param fileName File name
 * @param contentType MIME type
 * @param folder Folder path (e.g., 'images', 'files', 'brand-profile', 'instagram')
 * @param userId User ID (optional, for organizing files)
 * @param isPublic Whether the file should be publicly accessible (default false)
 * @returns Upload result containing URL, key, and bucket
 */
export async function uploadToS3(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
  folder: string = 'images',
  userId?: string,
  isPublic: boolean = false
): Promise<UploadResult> {
  try {
    // Build S3 key (path)
    let key: string
    if (userId && (folder === 'brand-profile' || folder === 'instagram')) {
      // Brand Profile and Instagram files are organized by user
      key = `${folder}/${userId}/${fileName}`
    } else {
      key = `${folder}/${fileName}`
    }

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      // Note: ACL is disabled for newer S3 buckets (Object Ownership: Bucket owner enforced)
      // Public access must be managed via Bucket Policy instead of ACL
      // Ensure your bucket has a Bucket Policy that allows public read access
      // Example Bucket Policy:
      // {
      //   "Version": "2012-10-17",
      //   "Statement": [
      //     {
      //       "Sid": "PublicReadGetObject",
      //       "Effect": "Allow",
      //       "Principal": "*",
      //       "Action": "s3:GetObject",
      //       "Resource": "arn:aws:s3:::BUCKET_NAME/instagram/*"
      //     }
      //   ]
      // }
    })

    await s3Client.send(command)

    // Generate URL
    // For public files, use standard URL
    // For private files, URL can be obtained later via presigned URL
    const region = process.env.AWS_REGION || 'us-east-1'
    const url = isPublic
      ? `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`
      : `s3://${BUCKET_NAME}/${key}` // Private files use s3:// protocol identifier

    return {
      url,
      key,
      bucket: BUCKET_NAME,
    }
  } catch (error) {
    console.error('S3 upload error:', error)
    throw new Error(`S3 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get presigned URL from S3 (for private files)
 * @param key File key in S3
 * @param expiresIn Expiration time in seconds (default 1 hour)
 * @returns Presigned URL
 */
export async function getSignedUrlFromS3(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    const url = await getSignedUrl(s3Client, command, { expiresIn })
    return url
  } catch (error) {
    console.error('Error getting S3 presigned URL:', error)
    throw new Error(`Failed to get presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete file from S3
 * @param key File key in S3
 */
export async function deleteFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await s3Client.send(command)
  } catch (error) {
    console.error('S3 delete error:', error)
    throw new Error(`S3 delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Check if S3 is configured
 */
export function isS3Configured(): boolean {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET_NAME &&
    process.env.AWS_REGION
  )
}

/**
 * Generate S3 public URL (for files set to public)
 * @param key File key in S3
 * @returns Public URL
 */
export function getS3PublicUrl(key: string): string {
  const region = process.env.AWS_REGION || 'us-east-1'
  return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`
}
