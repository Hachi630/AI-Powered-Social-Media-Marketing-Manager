import { Types } from 'mongoose'
import SocialMediaPost, { ISocialMediaPost, IMediaAttachment } from '../models/SocialMediaPost.js'
import AIGeneratedContent, { IAIGeneratedContent } from '../models/AIGeneratedContent.js'
import MediaFile, { IMediaFile } from '../models/MediaFile.js'
import APIResponse, { IAPIResponse } from '../models/APIResponse.js'

/**
 * Save a social media post to the database
 */
export async function saveSocialMediaPost(data: {
  userId: string | Types.ObjectId
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'sms' | 'whatsapp'
  postType: 'text' | 'image' | 'video' | 'link' | 'mixed'
  content: string
  mediaAttachments?: IMediaAttachment[]
  organizationId?: string
  organizationName?: string
  platformPostId?: string
  platformAuthorId?: string
  recipientPhoneNumber?: string
  senderPhoneNumber?: string
  direction?: 'incoming' | 'outgoing'
  status?: 'draft' | 'scheduled' | 'published' | 'failed'
  publishedAt?: Date
  aiGenerated?: boolean
  aiPrompt?: string
  aiModel?: string
  errorMessage?: string
  calendarItemId?: string | Types.ObjectId
}): Promise<ISocialMediaPost> {
  const post = new SocialMediaPost({
    userId: data.userId,
    platform: data.platform,
    postType: data.postType,
    content: data.content,
    mediaAttachments: data.mediaAttachments || [],
    organizationId: data.organizationId,
    organizationName: data.organizationName,
    platformPostId: data.platformPostId,
    platformAuthorId: data.platformAuthorId,
    recipientPhoneNumber: data.recipientPhoneNumber,
    senderPhoneNumber: data.senderPhoneNumber,
    direction: data.direction,
    status: data.status || 'published',
    publishedAt: data.publishedAt || new Date(),
    aiGenerated: data.aiGenerated || false,
    aiPrompt: data.aiPrompt,
    aiModel: data.aiModel,
    errorMessage: data.errorMessage,
    calendarItemId: data.calendarItemId,
  })

  return await post.save()
}

/**
 * Save AI-generated content to the database
 */
export async function saveAIGeneratedContent(data: {
  userId: string | Types.ObjectId
  conversationId?: string | Types.ObjectId
  contentType: 'text' | 'image' | 'content_plan' | 'suggestion' | 'summary' | 'translation'
  input: string
  output: string
  model: string
  parameters?: {
    temperature?: number
    maxTokens?: number
    topP?: number
    topK?: number
  }
  imageUrl?: string
  imagePrompt?: string
  contentPlanItems?: Array<{
    date: Date
    platform: string
    content: string
    mediaType?: string
  }>
  tokensUsed?: number
  processingTime?: number
  usedInPost?: string | Types.ObjectId
}): Promise<IAIGeneratedContent> {
  const content = new AIGeneratedContent({
    userId: data.userId,
    conversationId: data.conversationId,
    contentType: data.contentType,
    input: data.input,
    output: data.output,
    model: data.model,
    parameters: data.parameters,
    imageUrl: data.imageUrl,
    imagePrompt: data.imagePrompt,
    contentPlanItems: data.contentPlanItems,
    tokensUsed: data.tokensUsed,
    processingTime: data.processingTime,
    usedInPost: data.usedInPost,
  })

  return await content.save()
}

/**
 * Save a media file to the database
 */
export async function saveMediaFile(data: {
  userId: string | Types.ObjectId
  fileName: string
  originalName: string
  filePath: string
  fileUrl: string
  fileType: 'image' | 'video' | 'document' | 'audio'
  mimeType: string
  fileSize: number
  width?: number
  height?: number
  duration?: number
  thumbnailUrl?: string
  platformAssetId?: string
  platform?: 'linkedin' | 'twitter' | 'local'
  description?: string
  altText?: string
  storageProvider?: 'local' | 's3' | 'cloudinary'
  storageBucket?: string
  storageKey?: string
}): Promise<IMediaFile> {
  // Auto-detect storage provider
  let storageProvider: 'local' | 's3' | 'cloudinary' = data.storageProvider || 'local'
  let storageBucket: string | undefined = data.storageBucket
  let storageKey: string | undefined = data.storageKey

  // If fileUrl is S3 URL, auto-detect
  if (data.fileUrl.startsWith('https://') && data.fileUrl.includes('.s3.')) {
    storageProvider = 's3'
    // Extract bucket and key from URL
    const urlMatch = data.fileUrl.match(/https:\/\/([^\.]+)\.s3\.([^\.]+)\.amazonaws\.com\/(.+)/)
    if (urlMatch) {
      storageBucket = urlMatch[1]
      storageKey = urlMatch[3]
    }
  } else if (data.filePath.startsWith('s3://')) {
    storageProvider = 's3'
    // Extract bucket and key from s3:// path
    const s3Match = data.filePath.match(/s3:\/\/([^\/]+)\/(.+)/)
    if (s3Match) {
      storageBucket = s3Match[1]
      storageKey = s3Match[2]
    }
  }

  const mediaFile = new MediaFile({
    userId: data.userId,
    fileName: data.fileName,
    originalName: data.originalName,
    filePath: data.filePath,
    fileUrl: data.fileUrl,
    fileType: data.fileType,
    mimeType: data.mimeType,
    fileSize: data.fileSize,
    width: data.width,
    height: data.height,
    duration: data.duration,
    thumbnailUrl: data.thumbnailUrl,
    platformAssetId: data.platformAssetId,
    platform: data.platform || 'local',
    description: data.description,
    altText: data.altText,
    storageProvider,
    storageBucket,
    storageKey,
  })

  return await mediaFile.save()
}

/**
 * Save an API response to the database (for logging and debugging)
 */
export async function saveAPIResponse(data: {
  userId?: string | Types.ObjectId
  platform: 'linkedin' | 'twitter' | 'gemini' | 'openai' | 'other'
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  requestBody?: any
  requestHeaders?: Record<string, string>
  responseStatus: number
  responseBody?: any
  responseHeaders?: Record<string, string>
  error?: string
  duration?: number
  relatedPostId?: string | Types.ObjectId
  relatedMediaId?: string | Types.ObjectId
}): Promise<IAPIResponse> {
  const apiResponse = new APIResponse({
    userId: data.userId,
    platform: data.platform,
    endpoint: data.endpoint,
    method: data.method,
    requestBody: data.requestBody,
    requestHeaders: data.requestHeaders,
    responseStatus: data.responseStatus,
    responseBody: data.responseBody,
    responseHeaders: data.responseHeaders,
    error: data.error,
    duration: data.duration,
    timestamp: new Date(),
    relatedPostId: data.relatedPostId,
    relatedMediaId: data.relatedMediaId,
  })

  return await apiResponse.save()
}

/**
 * Update a social media post with engagement metrics
 */
export async function updatePostMetrics(
  platformPostId: string,
  metrics: {
    likes?: number
    comments?: number
    shares?: number
    views?: number
    impressions?: number
  }
): Promise<ISocialMediaPost | null> {
  return await SocialMediaPost.findOneAndUpdate(
    { platformPostId },
    { $set: metrics },
    { new: true }
  )
}

/**
 * Link a media file to a post
 */
export async function linkMediaToPost(
  mediaFileId: string | Types.ObjectId,
  postId: string | Types.ObjectId
): Promise<void> {
  await MediaFile.findByIdAndUpdate(mediaFileId, {
    $addToSet: { usedInPosts: postId }
  })

  // Also update the post to reference the media
  const mediaFile = await MediaFile.findById(mediaFileId)
  if (mediaFile) {
    await SocialMediaPost.findByIdAndUpdate(postId, {
      $addToSet: {
        mediaAttachments: {
          type: mediaFile.fileType === 'image' ? 'image' : mediaFile.fileType === 'video' ? 'video' : 'document',
          url: mediaFile.fileUrl,
          thumbnailUrl: mediaFile.thumbnailUrl,
          fileName: mediaFile.fileName,
          fileSize: mediaFile.fileSize,
          mimeType: mediaFile.mimeType,
          externalId: mediaFile.platformAssetId,
        }
      }
    } as any)
  }
}

