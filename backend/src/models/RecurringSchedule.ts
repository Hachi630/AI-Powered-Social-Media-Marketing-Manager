import mongoose, { Document, Schema, Types } from 'mongoose'

export type RecurrenceType = 'weekly' | 'daily'
export type JobHuntTone = 'technical' | 'storytelling' | 'achievement'
export type RecurringScheduleStatus = 'active' | 'paused'

export interface IRecurrencePattern {
  type: RecurrenceType
  daysOfWeek?: number[] // 0=Sun, 1=Mon, ..., 6=Sat (used when type='weekly')
  timeOfDay: string // HH:mm
}

export interface IRecurringSchedule extends Document {
  userId: Types.ObjectId
  name: string
  status: RecurringScheduleStatus
  subDomains: string[]
  tone: JobHuntTone
  hotTopics: string[]
  recurrencePattern: IRecurrencePattern
  includeImage: boolean
  imageStyle?: string
  endDate?: Date | null
  nextRunAt: Date
  lastGeneratedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

const RecurrencePatternSchema: Schema = new Schema(
  {
    type: { type: String, enum: ['weekly', 'daily'], required: true },
    daysOfWeek: { type: [Number], default: undefined },
    timeOfDay: {
      type: String,
      required: true,
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
    },
  },
  { _id: false }
)

const RecurringScheduleSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    status: {
      type: String,
      enum: ['active', 'paused'],
      default: 'active',
    },
    subDomains: { type: [String], default: [] },
    tone: {
      type: String,
      enum: ['technical', 'storytelling', 'achievement'],
      default: 'technical',
    },
    hotTopics: { type: [String], default: [] },
    recurrencePattern: { type: RecurrencePatternSchema, required: true },
    includeImage: { type: Boolean, default: true },
    imageStyle: { type: String, trim: true, default: 'clean tech illustration' },
    endDate: { type: Date, default: null },
    nextRunAt: { type: Date, required: true, index: true },
    lastGeneratedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

RecurringScheduleSchema.index({ userId: 1, status: 1 })
RecurringScheduleSchema.index({ status: 1, nextRunAt: 1 })

export default mongoose.model<IRecurringSchedule>(
  'RecurringSchedule',
  RecurringScheduleSchema
)
