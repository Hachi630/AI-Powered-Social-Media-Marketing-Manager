import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface IConversation extends Document {
  userId: Types.ObjectId
  title: string
  messages: IConversationMessage[]
  createdAt: Date
  updatedAt: Date
}

const ConversationMessageSchema: Schema = new Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
)

const ConversationSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    messages: {
      type: [ConversationMessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

// 创建索引以提高查询性能
ConversationSchema.index({ userId: 1, updatedAt: -1 })

export default mongoose.model<IConversation>('Conversation', ConversationSchema)

