import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IAIGeneratedContent extends Document {
  userId: Types.ObjectId
  conversationId?: Types.ObjectId // Link to conversation if from chat
  contentType: 'text' | 'image' | 'content_plan' | 'suggestion' | 'summary' | 'translation'
  input: string // User prompt/input
  output: string // AI-generated content
  aiModel: string // e.g., 'gemini-2.5-flash', 'gemini-2.5-flash-image'
  parameters?: {
    temperature?: number
    maxTokens?: number
    topP?: number
    topK?: number
  }

  // For image generation
  imageUrl?: string
  imagePrompt?: string
  imageStyle?: string
  imageSize?: string

  // For content plans
  contentPlanItems?: Array<{
    date: Date
    platform: string
    content: string
    mediaType?: string
  }>

  // Metadata
  tokensUsed?: number
  processingTime?: number // milliseconds
  cost?: number // if tracking costs

  // Usage tracking
  usedInPost?: Types.ObjectId // Reference to SocialMediaPost if used
  usedInCampaign?: Types.ObjectId // Reference to Campaign if used

  // Quality metrics
  qualityScore?: number
  userRating?: number
  userFeedback?: string

  createdAt: Date
  updatedAt: Date
}

const ContentPlanItemSchema: Schema = new Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    platform: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    mediaType: {
      type: String,
    },
  },
  { _id: false }
)

const AIGeneratedContentSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      index: true,
    },
    contentType: {
      type: String,
      enum: ['text', 'image', 'content_plan', 'suggestion', 'summary', 'translation'],
      required: true,
      index: true,
    },
    input: {
      type: String,
      required: true,
    },
    output: {
      type: String,
      required: true,
    },
    aiModel: {
      type: String,
      required: true,
      index: true,
    },
    parameters: {
      temperature: Number,
      maxTokens: Number,
      topP: Number,
      topK: Number,
    },
    imageUrl: {
      type: String,
    },
    imagePrompt: {
      type: String,
    },
    imageStyle: {
      type: String,
    },
    imageSize: {
      type: String,
    },
    contentPlanItems: {
      type: [ContentPlanItemSchema],
      default: [],
    },
    tokensUsed: {
      type: Number,
    },
    processingTime: {
      type: Number,
    },
    cost: {
      type: Number,
    },
    usedInPost: {
      type: Schema.Types.ObjectId,
      ref: 'SocialMediaPost',
      index: true,
    },
    usedInCampaign: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      index: true,
    },
    qualityScore: {
      type: Number,
      min: 0,
      max: 10,
    },
    userRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    userFeedback: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for efficient queries
AIGeneratedContentSchema.index({ userId: 1, contentType: 1, createdAt: -1 })
AIGeneratedContentSchema.index({ userId: 1, aiModel: 1 })
AIGeneratedContentSchema.index({ conversationId: 1 })
AIGeneratedContentSchema.index({ usedInPost: 1 })
AIGeneratedContentSchema.index({ createdAt: -1 })

export default mongoose.model<IAIGeneratedContent>('AIGeneratedContent', AIGeneratedContentSchema)








