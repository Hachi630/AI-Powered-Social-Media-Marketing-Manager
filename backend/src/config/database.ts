import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

// MongoDB URI must be provided via environment variable for security
const MONGODB_URI = process.env.MONGODB_URI

export const connectDB = async () => {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables. Please set it in your .env file.')
    }

    // MongoDB Atlas connection options
    const options = {
      // Remove deprecated options, use modern defaults
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    }

    await mongoose.connect(MONGODB_URI, options)
    console.log('MongoDB Atlas Connected successfully')
    console.log(`Database: ${mongoose.connection.db?.databaseName || 'unknown'}`)
  } catch (error) {
    console.error('MongoDB connection error:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
    process.exit(1)
  }

  // Handle connection events
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err)
  })

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected')
  })

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected')
  })
}

