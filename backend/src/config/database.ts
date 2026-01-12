import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

//const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/melo'
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://YOUR_MONGODB_USER:YOUR_MONGODB_PASSWORD@your-cluster.mongodb.net/?appName=Melo'
export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('MongoDB Connected')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

