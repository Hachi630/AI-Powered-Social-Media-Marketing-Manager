import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IMediaAttachment {
  type: 'image' | 'video' | 'link' | 'document'
  url: string
  thumbnailUrl?: string
  fileName?: string
  fileSize?: number
  mimeType?: string
  linkTitle?: string
  linkDescription?: string
  linkUrl?: string
  externalId?: string // LinkedIn URN, Twitter ID, etc.
}

export interface ISocialMediaPost extends Document {
  userId: Types.ObjectId
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'sms' | 'whatsapp'
  postType: 'text' | 'image' | 'video' | 'link' | 'mixed'
  content: string
  mediaAttachments?: IMediaAttachment[]
  organizationId?: string // For LinkedIn company pages
  organizationName?: string
  targetAudience?: string[]
  scheduledAt?: Date
  publishedAt?: Date
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  
  // Platform-specific IDs
  platformPostId?: string // LinkedIn post URN, Twitter tweet ID, etc.
  platformAuthorId?: string // LinkedIn author URN
  recipientPhoneNumber?: string // For SMS/WhatsApp messages (outgoing)
  senderPhoneNumber?: string // For SMS/WhatsApp messages (incoming)
  direction?: 'incoming' | 'outgoing' // Message direction for SMS/WhatsApp
  
  // Engagement metrics (updated from platform APIs)
  likes?: number
  comments?: number
  shares?: number
  views?: number
  impressions?: number
  
  // Metadata
  tags?: string[]
  location?: string
  language?: string
  
  // Error handling
  errorMessage?: string
  retryCount?: number
  
  // AI generation metadata
  aiGenerated?: boolean
  aiPrompt?: string
  aiModel?: string
  
  // Calendar tracking (to distinguish calendar publishes from direct publishes)
  calendarItemId?: Types.ObjectId
  
  createdAt: Date
  updatedAt: Date
}

const MediaAttachmentSchema: Schema = new Schema(
  {
    type: {
      type: String,
      enum: ['image', 'video', 'link', 'document'],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
    },
    fileName: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    mimeType: {
      type: String,
    },
    linkTitle: {
      type: String,
    },
    linkDescription: {
      type: String,
    },
    linkUrl: {
      type: String,
    },
    externalId: {
      type: String, // LinkedIn asset URN, etc.
    },
  },
  { _id: false }
)

const SocialMediaPostSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['linkedin', 'twitter', 'facebook', 'instagram', 'sms', 'whatsapp'],
      required: true,
      index: true,
    },
    postType: {
      type: String,
      enum: ['text', 'image', 'video', 'link', 'mixed'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    mediaAttachments: {
      type: [MediaAttachmentSchema],
      default: [],
    },
    organizationId: {
      type: String,
      index: true,
    },
    organizationName: {
      type: String,
    },
    targetAudience: {
      type: [String],
      default: [],
    },
    scheduledAt: {
      type: Date,
      index: true,
    },
    publishedAt: {
      type: Date,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published', 'failed'],
      default: 'draft',
      index: true,
    },
    platformPostId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    platformAuthorId: {
      type: String,
    },
    recipientPhoneNumber: {
      type: String,
      index: true,
    },
    senderPhoneNumber: {
      type: String,
      index: true,
    },
    direction: {
      type: String,
      enum: ['incoming', 'outgoing'],
      index: true,
    },
    likes: {
      type: Number,
      default: 0,
    },
    comments: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    impressions: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
    },
    language: {
      type: String,
      default: 'en',
    },
    errorMessage: {
      type: String,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    aiGenerated: {
      type: Boolean,
      default: false,
      index: true,
    },
    aiPrompt: {
      type: String,
    },
    aiModel: {
      type: String,
    },
    calendarItemId: {
      type: Schema.Types.ObjectId,
      ref: 'CalendarItem',
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for efficient queries
SocialMediaPostSchema.index({ userId: 1, platform: 1, createdAt: -1 })
SocialMediaPostSchema.index({ userId: 1, status: 1 })
SocialMediaPostSchema.index({ platformPostId: 1 })
SocialMediaPostSchema.index({ scheduledAt: 1, status: 1 })

export default mongoose.model<ISocialMediaPost>('SocialMediaPost', SocialMediaPostSchema)


