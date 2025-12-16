import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IContact extends Document {
  userId: Types.ObjectId
  name: string
  phoneNumber: string
  email?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const ContactSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

// Create index to improve query performance
ContactSchema.index({ userId: 1, phoneNumber: 1 })
ContactSchema.index({ userId: 1, name: 1 })

export default mongoose.model<IContact>('Contact', ContactSchema)







