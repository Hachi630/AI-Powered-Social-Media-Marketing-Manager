import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IMediaFile extends Document {
  userId: Types.ObjectId
  fileName: string
  originalName: string
  filePath: string
  fileUrl: string
  fileType: 'image' | 'video' | 'document' | 'audio'
  mimeType: string
  fileSize: number // bytes
  width?: number // for images/videos
  height?: number // for images/videos
  duration?: number // for videos/audio in seconds
  
  // Thumbnail for videos/images
  thumbnailUrl?: string
  thumbnailPath?: string
  
  // Platform-specific IDs (e.g., LinkedIn asset URN)
  platformAssetId?: string
  platform?: 'linkedin' | 'twitter' | 'local'
  
  // Usage tracking
  usedInPosts?: Types.ObjectId[] // Array of SocialMediaPost IDs
  usedInConversations?: Types.ObjectId[] // Array of Conversation IDs
  
  // Metadata
  description?: string
  tags?: string[]
  altText?: string // for accessibility
  
  // Processing status
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed'
  processingError?: string
  
  // Storage info
  storageProvider?: 'local' | 's3' | 'cloudinary'
  storageBucket?: string
  storageKey?: string
  
  createdAt: Date
  updatedAt: Date
}

const MediaFileSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['image', 'video', 'document', 'audio'],
      required: true,
      index: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    duration: {
      type: Number,
    },
    thumbnailUrl: {
      type: String,
    },
    thumbnailPath: {
      type: String,
    },
    platformAssetId: {
      type: String,
      index: true,
    },
    platform: {
      type: String,
      enum: ['linkedin', 'twitter', 'local'],
      default: 'local',
    },
    usedInPosts: {
      type: [Schema.Types.ObjectId],
      ref: 'SocialMediaPost',
      default: [],
    },
    usedInConversations: {
      type: [Schema.Types.ObjectId],
      ref: 'Conversation',
      default: [],
    },
    description: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    altText: {
      type: String,
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'completed',
    },
    processingError: {
      type: String,
    },
    storageProvider: {
      type: String,
      enum: ['local', 's3', 'cloudinary'],
      default: 'local',
    },
    storageBucket: {
      type: String,
    },
    storageKey: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for efficient queries
MediaFileSchema.index({ userId: 1, fileType: 1, createdAt: -1 })
MediaFileSchema.index({ userId: 1, createdAt: -1 })
MediaFileSchema.index({ platformAssetId: 1 })
MediaFileSchema.index({ processingStatus: 1 })

export default mongoose.model<IMediaFile>('MediaFile', MediaFileSchema)








