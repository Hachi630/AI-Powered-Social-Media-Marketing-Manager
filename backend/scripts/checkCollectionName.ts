import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/melo'

async function checkCollectionName() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')
    
    const db = mongoose.connection.db
    
    // Check both singular and plural
    const collections = ['prediction_best_time', 'prediction_best_times']
    
    for (const collectionName of collections) {
      const collection = db.collection(collectionName)
      const exists = await collection.countDocuments({}) > 0
      const count = await collection.countDocuments({})
      
      console.log(`📊 Collection: ${collectionName}`)
      console.log(`   Exists: ${exists ? '✅' : '❌'}`)
      console.log(`   Count: ${count} documents`)
      
      if (count > 0) {
        const sample = await collection.findOne({})
        console.log(`   Sample fields: ${Object.keys(sample || {}).slice(0, 15).join(', ')}`)
        console.log(`   Has 'day' field: ${sample && 'day' in sample ? '✅' : '❌'}`)
        console.log(`   Has 'platform' field: ${sample && 'platform' in sample ? '✅' : '❌'}`)
        console.log(`   Has 'engagementScore' field: ${sample && 'engagementScore' in sample ? '✅' : '❌'}`)
      }
      console.log('')
    }
    
    // Check what the model is actually using
    const PredictionBestTime = (await import('../src/models/PredictionBestTime')).default
    const modelCollectionName = PredictionBestTime.collection.name
    console.log(`📋 Model collection name: ${modelCollectionName}`)
    
    const modelCount = await PredictionBestTime.countDocuments({})
    console.log(`📊 Model count: ${modelCount} documents\n`)
    
    if (modelCount === 0) {
      console.log('⚠️  Model shows 0 documents but collection might have data.')
      console.log('   Checking if we need to use a different collection name...\n')
      
      // Try to find the actual collection
      const allCollections = await db.listCollections().toArray()
      const predictionCollections = allCollections.filter(c => 
        c.name.toLowerCase().includes('prediction') || 
        c.name.toLowerCase().includes('best') ||
        c.name.toLowerCase().includes('time')
      )
      
      console.log('🔍 Collections that might contain the data:')
      for (const col of predictionCollections) {
        const count = await db.collection(col.name).countDocuments({})
        console.log(`   ${col.name}: ${count} documents`)
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

checkCollectionName()



