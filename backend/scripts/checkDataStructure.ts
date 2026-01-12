import mongoose from 'mongoose'
import dotenv from 'dotenv'
import PredictionBestTime from '../src/models/PredictionBestTime'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/melo'

async function checkDataStructure() {
  try {
    console.log('🔍 Checking data structure in prediction_best_time collection...\n')
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')
    
    // Count total documents
    const totalCount = await PredictionBestTime.countDocuments({})
    console.log(`📊 Total documents: ${totalCount}\n`)
    
    if (totalCount === 0) {
      console.log('⚠️  Collection is empty. No data found.')
      await mongoose.disconnect()
      return
    }
    
    // Get a sample document to see the structure
    const sample = await PredictionBestTime.findOne({}).lean()
    console.log('📄 Sample document structure:')
    console.log(JSON.stringify(sample, null, 2))
    console.log('\n')
    
    // Check field presence
    console.log('🔍 Checking field presence:')
    const fieldChecks = {
      timestamp: await PredictionBestTime.countDocuments({ timestamp: { $exists: true } }),
      day: await PredictionBestTime.countDocuments({ day: { $exists: true } }),
      month: await PredictionBestTime.countDocuments({ month: { $exists: true } }),
      hour: await PredictionBestTime.countDocuments({ hour: { $exists: true } }),
      platform: await PredictionBestTime.countDocuments({ platform: { $exists: true } }),
      likes: await PredictionBestTime.countDocuments({ likes: { $exists: true } }),
      retweets: await PredictionBestTime.countDocuments({ retweets: { $exists: true } }),
      engagementScore: await PredictionBestTime.countDocuments({ engagementScore: { $exists: true } }),
      sentiment: await PredictionBestTime.countDocuments({ sentiment: { $exists: true } }),
      text: await PredictionBestTime.countDocuments({ text: { $exists: true } }),
      hashtags: await PredictionBestTime.countDocuments({ hashtags: { $exists: true } }),
      country: await PredictionBestTime.countDocuments({ country: { $exists: true } }),
    }
    
    Object.entries(fieldChecks).forEach(([field, count]) => {
      const percentage = ((count / totalCount) * 100).toFixed(1)
      const status = count === totalCount ? '✅' : count > 0 ? '⚠️' : '❌'
      console.log(`  ${status} ${field}: ${count}/${totalCount} (${percentage}%)`)
    })
    
    // Check platform distribution
    console.log('\n📱 Platform distribution:')
    const platforms = await PredictionBestTime.aggregate([
      { $group: { _id: '$platform', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
    platforms.forEach((p: any) => {
      console.log(`  ${p._id || '(null)'}: ${p.count}`)
    })
    
    // Check if data needs transformation
    console.log('\n🔧 Data transformation check:')
    
    // Check for Unnamed columns (should not exist)
    const hasUnnamed = await PredictionBestTime.countDocuments({
      $or: [
        { 'Unnamed: 0': { $exists: true } },
        { 'Unnamed: 0.1': { $exists: true } }
      ]
    })
    console.log(`  Unnamed columns: ${hasUnnamed > 0 ? '❌ Found (needs cleaning)' : '✅ None'}`)
    
    // Check if day field is correct format
    const dayFormat = await PredictionBestTime.aggregate([
      { $group: { _id: '$day', count: { $sum: 1 } } },
      { $limit: 10 }
    ])
    console.log(`  Day format samples: ${dayFormat.map((d: any) => d._id).join(', ')}`)
    
    // Check timestamp format
    const timestampSample = await PredictionBestTime.findOne({}, { timestamp: 1 })
    if (timestampSample) {
      const ts = timestampSample.timestamp
      console.log(`  Timestamp type: ${ts instanceof Date ? '✅ Date object' : `⚠️ ${typeof ts}`}`)
      if (ts instanceof Date) {
        console.log(`  Timestamp sample: ${ts.toISOString()}`)
      }
    }
    
    // Check engagementScore calculation
    const missingEngagement = await PredictionBestTime.countDocuments({
      $or: [
        { engagementScore: { $exists: false } },
        { engagementScore: null }
      ]
    })
    console.log(`  Missing engagementScore: ${missingEngagement > 0 ? `⚠️ ${missingEngagement} records` : '✅ All have it'}`)
    
    // Test a query to see if analytics would work
    console.log('\n🧪 Testing analytics query:')
    try {
      const testQuery = await PredictionBestTime.aggregate([
        { $match: { platform: { $exists: true } } },
        { $group: {
          _id: { platform: '$platform', hour: '$hour' },
          avgEngagement: { $avg: '$engagementScore' },
          count: { $sum: 1 }
        }},
        { $limit: 5 }
      ])
      console.log(`  ✅ Query test successful: ${testQuery.length} results`)
      if (testQuery.length > 0) {
        console.log('  Sample result:', JSON.stringify(testQuery[0], null, 2))
      }
    } catch (error: any) {
      console.log(`  ❌ Query test failed: ${error.message}`)
    }
    
    console.log('\n✅ Data structure check complete!')
    
  } catch (error: any) {
    console.error('❌ Error:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
  }
}

checkDataStructure()



