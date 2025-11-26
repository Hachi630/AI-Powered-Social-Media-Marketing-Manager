import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  email: string
  password?: string
  googleId?: string
  name?: string
  avatar?: string
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
        return this.authProvider === 'local'
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
    },
    avatar: {
      type: String,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.model<IUser>('User', UserSchema)

