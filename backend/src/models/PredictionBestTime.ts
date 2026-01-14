import mongoose, { Schema, Document } from 'mongoose'

export interface IPredictionBestTime extends Document {
  timestamp: Date
  day: string // Monday, Tuesday, etc. (dayOfWeek)
  month: string // January, February, etc.
  hour: number // 0-23
  year?: number // Year extracted from timestamp
  dayOfMonth?: number // Day of month (1-31)
  platform: string // instagram, twitter, linkedin, facebook
  likes: number
  retweets: number
  sentiment: string // positive, negative, neutral
  text: string
  hashtags?: string[]
  country?: string
  engagementScore: number // calculated: likes + retweets (required)
  createdAt?: Date
  updatedAt?: Date
}

const PredictionBestTimeSchema: Schema = new Schema(
  {
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    day: {
      type: String,
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      index: true,
    },
    month: {
      type: String,
      required: true,
      enum: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ],
    },
    hour: {
      type: Number,
      required: true,
      min: 0,
      max: 23,
      index: true,
    },
    platform: {
      type: String,
      required: true,
      enum: ['instagram', 'twitter', 'linkedin', 'facebook'],
      index: true,
    },
    likes: {
      type: Number,
      default: 0,
    },
    retweets: {
      type: Number,
      default: 0,
    },
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      index: true,
    },
    text: {
      type: String,
      required: true,
    },
    hashtags: {
      type: [String],
      default: [],
    },
    country: {
      type: String,
      index: true,
    },
    engagementScore: {
      type: Number,
      required: true,
      default: function(this: IPredictionBestTime) {
        return (this.likes || 0) + (this.retweets || 0)
      },
    },
    year: {
      type: Number,
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31,
    },
  },
  {
    timestamps: true,
  }
)

// Compound indexes for efficient queries (as specified in requirements)
// Main query patterns: platform, country, sentiment, timestamp
PredictionBestTimeSchema.index({ platform: 1, timestamp: 1 }) // For time-series queries
PredictionBestTimeSchema.index({ platform: 1, day: 1, hour: 1 }) // For day×hour heatmaps
PredictionBestTimeSchema.index({ platform: 1, hour: 1 }) // For best hours
PredictionBestTimeSchema.index({ platform: 1, day: 1 }) // For best days
PredictionBestTimeSchema.index({ country: 1, platform: 1 }) // For country-based insights
PredictionBestTimeSchema.index({ sentiment: 1, platform: 1 }) // For sentiment analysis
PredictionBestTimeSchema.index({ sentiment: 1, platform: 1, hour: 1 }) // For sentiment-aware timing
PredictionBestTimeSchema.index({ country: 1, platform: 1, hour: 1 }) // For country-based recommendations
PredictionBestTimeSchema.index({ engagementScore: -1 }) // For top posts queries

// Use explicit collection name to prevent Mongoose pluralization
// The collection in the database is 'prediction_best_time' (singular)
export default mongoose.model<IPredictionBestTime>('prediction_best_time', PredictionBestTimeSchema, 'prediction_best_time')




