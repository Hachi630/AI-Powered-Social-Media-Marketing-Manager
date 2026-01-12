import mongoose from 'mongoose'
import dotenv from 'dotenv'
import PredictionBestTime from '../src/models/PredictionBestTime'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/melo'

async function debugQuery() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')
    
    const db = mongoose.connection.db
    const collection = db.collection('prediction_best_time')
    
    // Direct collection query (bypassing model)
    console.log('1️⃣ Direct collection query (bypassing Mongoose model):')
    const directCount = await collection.countDocuments({})
    console.log(`   Count: ${directCount} documents\n`)
    
    if (directCount > 0) {
      const directSample = await collection.findOne({})
      console.log('   Sample document:')
      console.log(JSON.stringify(directSample, null, 2))
      console.log('')
    }
    
    // Model query
    console.log('2️⃣ Mongoose model query:')
    const modelCount = await PredictionBestTime.countDocuments({})
    console.log(`   Count: ${modelCount} documents\n`)
    
    if (modelCount > 0) {
      const modelSample = await PredictionBestTime.findOne({}).lean()
      console.log('   Sample document:')
      console.log(JSON.stringify(modelSample, null, 2))
      console.log('')
    }
    
    // Check schema validation
    console.log('3️⃣ Testing schema validation:')
    if (directCount > 0) {
      const testDoc = await collection.findOne({})
      try {
        // Try to create a model instance
        const testModel = new PredictionBestTime(testDoc)
        await testModel.validate()
        console.log('   ✅ Document passes schema validation')
      } catch (error: any) {
        console.log('   ❌ Schema validation error:', error.message)
        console.log('   This might be why queries return 0 results')
      }
    }
    
    // Try a simple aggregation
    console.log('\n4️⃣ Testing aggregation query:')
    try {
      const aggResult = await PredictionBestTime.aggregate([
        { $match: {} },
        { $limit: 1 },
        { $project: { platform: 1, hour: 1, day: 1, engagementScore: 1 } }
      ])
      console.log(`   Result: ${aggResult.length} documents`)
      if (aggResult.length > 0) {
        console.log('   Sample:', JSON.stringify(aggResult[0], null, 2))
      }
    } catch (error: any) {
      console.log('   ❌ Aggregation error:', error.message)
    }
    
    // Check database name
    console.log('\n5️⃣ Connection details:')
    console.log(`   Database name: ${db.databaseName}`)
    console.log(`   Model collection name: ${PredictionBestTime.collection.name}`)
    console.log(`   Connection URI: ${MONGODB_URI}`)
    
  } catch (error: any) {
    console.error('❌ Error:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

debugQuery()



