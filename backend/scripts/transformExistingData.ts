import mongoose from 'mongoose'
import dotenv from 'dotenv'
import PredictionBestTime from '../src/models/PredictionBestTime'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/melo'

// Day of week mapping
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function parseTimestamp(ts: any): Date {
  if (!ts) return new Date()
  if (ts instanceof Date) return ts
  if (typeof ts === 'number') {
    if (ts < 4102444800) return new Date(ts * 1000)
    return new Date(ts)
  }
  if (typeof ts === 'string') {
    const parsed = new Date(ts)
    if (!isNaN(parsed.getTime())) return parsed
  }
  return new Date()
}

function getDayOfWeek(date: Date, useUTC: boolean = true): string {
  // Use UTC day if timestamp is in UTC (which it should be)
  // This ensures day matches the timestamp timezone
  const dayIndex = useUTC ? date.getUTCDay() : date.getDay()
  return DAYS_OF_WEEK[dayIndex]
}

function getMonthName(date: Date, useUTC: boolean = true): string {
  // Use UTC month to match timestamp timezone
  const monthIndex = useUTC ? date.getUTCMonth() : date.getMonth()
  return MONTHS[monthIndex]
}

function normalizePlatform(platform: any): string {
  if (!platform) return 'unknown'
  const p = String(platform).toLowerCase().trim()
  const platformMap: Record<string, string> = {
    'instagram': 'instagram',
    'ig': 'instagram',
    'twitter': 'twitter',
    'x': 'twitter',
    'linkedin': 'linkedin',
    'li': 'linkedin',
    'facebook': 'facebook',
    'fb': 'facebook',
  }
  return platformMap[p] || p
}

function normalizeSentiment(sentiment: any): string {
  if (!sentiment) return 'neutral'
  const s = String(sentiment).toLowerCase().trim()
  if (s.includes('positive') || s === 'pos') return 'positive'
  if (s.includes('negative') || s === 'neg') return 'negative'
  return 'neutral'
}

function parseHashtags(hashtags: any): string[] {
  if (!hashtags) return []
  if (Array.isArray(hashtags)) {
    return hashtags.filter(h => h && typeof h === 'string').map(h => h.trim())
  }
  if (typeof hashtags === 'string') {
    return hashtags
      .split(/[,|;]/)
      .map(h => h.trim().replace(/^#/, ''))
      .filter(h => h.length > 0)
  }
  return []
}

function toNumber(value: any): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''))
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

async function transformExistingData() {
  try {
    console.log('🔄 Transforming existing data in prediction_best_time collection...\n')
    
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')
    
    const db = mongoose.connection.db
    const collection = db.collection('prediction_best_time')
    
    const totalCount = await collection.countDocuments({})
    console.log(`📊 Found ${totalCount} documents to transform\n`)
    
    if (totalCount === 0) {
      console.log('⚠️  No documents found. Nothing to transform.')
      await mongoose.disconnect()
      return
    }
    
    // Get a sample to understand structure
    const sample = await collection.findOne({})
    console.log('📄 Sample document (before transformation):')
    console.log(JSON.stringify(sample, null, 2))
    console.log('\n')
    
    // Process documents in batches
    const batchSize = 100
    let processed = 0
    let updated = 0
    let errors = 0
    
    const cursor = collection.find({})
    
    console.log('🔄 Processing documents...\n')
    
    while (await cursor.hasNext()) {
      const batch: any[] = []
      
      // Collect a batch
      for (let i = 0; i < batchSize && await cursor.hasNext(); i++) {
        batch.push(await cursor.next())
      }
      
      // Transform each document
      const operations = batch.map((doc: any) => {
        try {
          // Parse timestamp (handle various formats)
          // CRITICAL: Use UTC for consistency - timestamp is the source of truth
          const timestamp = parseTimestamp(
            doc.Timestamp || doc.timestamp || doc.date || doc.Date || doc.createdAt
          )
          const date = new Date(timestamp)
          
          // Extract date components using UTC methods to match the timestamp timezone
          // CRITICAL: Use UTC consistently - timestamp is stored in UTC, so day/hour must be UTC too
          // This ensures day/hour match the actual timestamp timezone
          const year = date.getUTCFullYear()
          const month = getMonthName(date, true) // Use UTC month
          const dayOfMonth = date.getUTCDate()
          const hour = date.getUTCHours() // Use UTC hour to match timestamp
          const day = getDayOfWeek(date, true) // Use UTC day to match timestamp
          
          // Get platform (case-insensitive)
          const platform = normalizePlatform(doc.Platform || doc.platform)
          
          // Get likes and retweets (case-insensitive, handle various field names)
          const likes = toNumber(doc.Likes || doc.likes || doc.Like || doc.like || 0)
          const retweets = toNumber(doc.Retweets || doc.retweets || doc.Retweet || doc.retweet || 0)
          
          // Calculate engagement
          const engagementScore = likes + retweets
          
          // Get sentiment
          const sentiment = normalizeSentiment(doc.Sentiment || doc.sentiment)
          
          // Get text
          const text = String(doc.Text || doc.text || doc.content || doc.Content || '').trim()
          
          // Get hashtags
          const hashtags = parseHashtags(doc.Hashtags || doc.hashtags || doc.hashtag)
          
          // Get country
          const country = String(doc.Country || doc.country || '').trim() || undefined
          
          // Build the transformed document (replace entire document to remove unwanted fields)
          const transformedDoc: any = {
            _id: doc._id,
            timestamp: date,
            platform,
            likes,
            retweets,
            sentiment,
            text,
            hashtags: hashtags.length > 0 ? hashtags : undefined,
            country: country || undefined,
            engagementScore,
            day,
            month,
            hour,
            year,
            dayOfMonth,
            createdAt: doc.createdAt || new Date(),
            updatedAt: new Date(),
          }
          
          // Remove undefined fields
          Object.keys(transformedDoc).forEach(key => {
            if (transformedDoc[key] === undefined) {
              delete transformedDoc[key]
            }
          })
          
          return {
            replaceOne: {
              filter: { _id: doc._id },
              replacement: transformedDoc,
            }
          }
        } catch (error: any) {
          console.error(`Error processing document ${doc._id}:`, error.message)
          errors++
          return null
        }
      }).filter(op => op !== null)
      
      // Execute batch update
      if (operations.length > 0) {
        const result = await collection.bulkWrite(operations)
        updated += result.modifiedCount
        processed += batch.length
        console.log(`✅ Processed ${processed}/${totalCount} documents (${updated} updated)...`)
      }
    }
    
    console.log(`\n✅ Transformation complete!`)
    console.log(`   Processed: ${processed} documents`)
    console.log(`   Updated: ${updated} documents`)
    console.log(`   Errors: ${errors} documents\n`)
    
    // Verify transformation
    console.log('🔍 Verifying transformation...\n')
    const transformedSample = await collection.findOne({})
    console.log('📄 Sample document (after transformation):')
    console.log(JSON.stringify(transformedSample, null, 2))
    console.log('\n')
    
    // Check field presence
    const fieldChecks = {
      timestamp: await collection.countDocuments({ timestamp: { $exists: true, $type: 'date' } }),
      day: await collection.countDocuments({ day: { $exists: true } }),
      hour: await collection.countDocuments({ hour: { $exists: true } }),
      platform: await collection.countDocuments({ platform: { $exists: true } }),
      engagementScore: await collection.countDocuments({ engagementScore: { $exists: true } }),
    }
    
    console.log('✅ Field verification:')
    Object.entries(fieldChecks).forEach(([field, count]) => {
      const status = count === totalCount ? '✅' : '⚠️'
      console.log(`  ${status} ${field}: ${count}/${totalCount}`)
    })
    
    // Recreate indexes
    console.log('\n🔧 Recreating indexes...')
    await PredictionBestTime.collection.dropIndexes().catch(() => {})
    await PredictionBestTime.collection.createIndex({ platform: 1, timestamp: 1 })
    await PredictionBestTime.collection.createIndex({ platform: 1, day: 1, hour: 1 })
    await PredictionBestTime.collection.createIndex({ platform: 1, hour: 1 })
    await PredictionBestTime.collection.createIndex({ platform: 1, day: 1 })
    await PredictionBestTime.collection.createIndex({ country: 1, platform: 1 })
    await PredictionBestTime.collection.createIndex({ sentiment: 1, platform: 1 })
    await PredictionBestTime.collection.createIndex({ sentiment: 1, platform: 1, hour: 1 })
    await PredictionBestTime.collection.createIndex({ country: 1, platform: 1, hour: 1 })
    await PredictionBestTime.collection.createIndex({ engagementScore: -1 })
    console.log('✅ Indexes recreated\n')
    
    // Print summary
    console.log('📊 Data Summary:')
    const platformCounts = await collection.aggregate([
      { $group: { _id: '$platform', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray()
    console.log('\nRecords by platform:')
    platformCounts.forEach((p: any) => {
      console.log(`  ${p._id || '(null)'}: ${p.count}`)
    })
    
    console.log('\n✅ Data transformation complete!')
    console.log('   Your visualizations should now work! 🎉')
    
  } catch (error: any) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

transformExistingData()
  .then(() => {
    console.log('\n🎉 Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })



