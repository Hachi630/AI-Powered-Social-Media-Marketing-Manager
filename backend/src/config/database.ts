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
      serverSelectionTimeoutMS: 30000, // Increased timeout to 30s for better reliability
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      connectTimeoutMS: 30000, // Connection timeout
    }

    await mongoose.connect(MONGODB_URI, options)
    
    // Wait for connection to be ready before proceeding
    if (mongoose.connection.readyState !== 1) {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('MongoDB connection timeout - connection not ready after 30 seconds'))
        }, 30000)
        
        mongoose.connection.once('connected', () => {
          clearTimeout(timeout)
          resolve()
        })
        
        mongoose.connection.once('error', (err) => {
          clearTimeout(timeout)
          reject(err)
        })
      })
    }
    
    console.log('MongoDB Atlas Connected successfully')
    console.log(`Database: ${mongoose.connection.db?.databaseName || 'unknown'}`)
    console.log(`Connection state: ${mongoose.connection.readyState} (1=connected)`)
  } catch (error: any) {
    console.error('MongoDB connection error:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
      console.error('Error code:', (error as any).code)
    }
    
    // Check if it's a DNS/network error
    if (error.code === 'ECONNREFUSED' || error.message?.includes('querySrv') || error.message?.includes('ECONNREFUSED')) {
      console.error('\n❌ MongoDB Connection Failed:')
      console.error('   Error: DNS resolution failed (querySrv ECONNREFUSED)')
      console.error('   Possible causes:')
      console.error('   1. MongoDB Atlas cluster is paused or deleted')
      console.error('   2. Network connectivity issues')
      console.error('   3. DNS resolution problems')
      console.error('   4. Firewall blocking MongoDB connection')
      console.error('   5. Incorrect MONGODB_URI in .env file')
      console.error('\n💡 Solutions:')
      console.error('   - Check MongoDB Atlas dashboard to ensure cluster is running')
      console.error('   - Verify MONGODB_URI in backend/.env is correct')
      console.error('   - Check network connection and DNS settings')
      console.error('   - Verify IP whitelist in MongoDB Atlas (should allow all IPs: 0.0.0.0/0)')
    }
    
    // Don't exit - allow server to start but API calls will fail gracefully
    console.warn('\n⚠️  Server will continue but database operations will fail until MongoDB is connected.\n')
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

