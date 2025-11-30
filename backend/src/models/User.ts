import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  email: string
  password?: string
  googleId?: string
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
  authProvider: 'local' | 'google'
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
      required: function(this: IUser) {
        // Password is required only if user doesn't have googleId
        // If user has googleId, they are using Google OAuth and password is not required
        return !this.googleId
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      trim: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
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

