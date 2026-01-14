import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IAPIResponse extends Document {
  userId?: Types.ObjectId
  platform: 'linkedin' | 'twitter' | 'gemini' | 'openai' | 'other'
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  requestBody?: any
  requestHeaders?: Record<string, string>
  responseStatus: number
  responseBody?: any
  responseHeaders?: Record<string, string>
  error?: string
  duration?: number // milliseconds
  timestamp: Date
  
  // Related entities
  relatedPostId?: Types.ObjectId
  relatedMediaId?: Types.ObjectId
  
  createdAt: Date
}

const APIResponseSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    platform: {
      type: String,
      enum: ['linkedin', 'twitter', 'gemini', 'openai', 'other'],
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      required: true,
    },
    requestBody: {
      type: Schema.Types.Mixed,
    },
    requestHeaders: {
      type: Schema.Types.Mixed,
    },
    responseStatus: {
      type: Number,
      required: true,
      index: true,
    },
    responseBody: {
      type: Schema.Types.Mixed,
    },
    responseHeaders: {
      type: Schema.Types.Mixed,
    },
    error: {
      type: String,
    },
    duration: {
      type: Number,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    relatedPostId: {
      type: Schema.Types.ObjectId,
      ref: 'SocialMediaPost',
      index: true,
    },
    relatedMediaId: {
      type: Schema.Types.ObjectId,
      ref: 'MediaFile',
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for efficient queries
APIResponseSchema.index({ userId: 1, platform: 1, timestamp: -1 })
APIResponseSchema.index({ platform: 1, responseStatus: 1, timestamp: -1 })
APIResponseSchema.index({ relatedPostId: 1 })
APIResponseSchema.index({ timestamp: -1 })

// TTL index to auto-delete old logs after 90 days (optional)
// APIResponseSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 })

export default mongoose.model<IAPIResponse>('APIResponse', APIResponseSchema)








