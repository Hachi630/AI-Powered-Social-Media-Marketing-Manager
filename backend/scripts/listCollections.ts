import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/melo'

async function listCollections() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')
    
    const db = mongoose.connection.db
    const collections = await db.listCollections().toArray()
    
    console.log('📚 Collections in melo database:')
    console.log('================================\n')
    
    if (collections.length === 0) {
      console.log('⚠️  No collections found in the database')
    } else {
      for (const collection of collections) {
        const count = await db.collection(collection.name).countDocuments({})
        console.log(`  ${collection.name}: ${count} documents`)
        
        // If it might be related, show a sample
        if (collection.name.toLowerCase().includes('prediction') || 
            collection.name.toLowerCase().includes('best') ||
            collection.name.toLowerCase().includes('time') ||
            collection.name.toLowerCase().includes('post')) {
          const sample = await db.collection(collection.name).findOne({})
          if (sample) {
            console.log(`    Sample fields: ${Object.keys(sample).slice(0, 10).join(', ')}`)
          }
        }
      }
    }
    
    console.log('\n')
    
    // Check prediction_best_time specifically
    const predictionCount = await db.collection('prediction_best_time').countDocuments({})
    console.log(`📊 prediction_best_time collection: ${predictionCount} documents`)
    
    if (predictionCount === 0) {
      console.log('\n💡 The prediction_best_time collection is empty.')
      console.log('   You need to import data from a CSV or JSON file.')
      console.log('   Do you have the original data file?')
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

listCollections()



