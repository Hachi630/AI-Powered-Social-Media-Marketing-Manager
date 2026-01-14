import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IEvent extends Document {
  userId: Types.ObjectId
  calendarItemIds: Types.ObjectId[] // Array of calendar items in this event
  eventNumber: number // Global auto-increment counter (unique across all users)
  date: Date // Date copied from calendar items (earliest date if multiple items)
  createdAt: Date
  updatedAt: Date
}

const EventSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    calendarItemIds: [{
      type: Schema.Types.ObjectId,
      ref: 'CalendarItem',
      required: true,
    }],
    eventNumber: {
      type: Number,
      required: true,
      unique: true, // Global unique counter
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

// Create compound indexes for efficient queries
EventSchema.index({ userId: 1, eventNumber: 1 })
EventSchema.index({ userId: 1, createdAt: 1 })
EventSchema.index({ eventNumber: 1 }) // Index for global counter

export default mongoose.model<IEvent>('Event', EventSchema)

