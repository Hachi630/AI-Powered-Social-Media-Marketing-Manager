import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  email: string
  password: string // Store plaintext password (for demonstration only)
  name?: string
  brandName?: string
  phone?: string
  birthday?: string
  gender?: string
  address?: string
  aboutMe?: string
  avatar?: string
  industry?: string
  toneOfVoice?: string
  knowledgeProducts?: string[]
  targetAudience?: string[]
  createdAt: Date
  updatedAt: Date
}

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
    brandName: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    birthday: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    aboutMe: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    toneOfVoice: {
      type: String,
      trim: true,
    },
    knowledgeProducts: {
      type: [String],
      default: [],
    },
    targetAudience: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.model<IUser>('User', UserSchema)

