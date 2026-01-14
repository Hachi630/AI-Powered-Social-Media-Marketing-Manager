import mongoose from 'mongoose'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import PredictionBestTime from '../src/models/PredictionBestTime'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/melo'

// Day of week mapping
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

interface RawRecord {
  [key: string]: any
  Timestamp?: string
  timestamp?: string
  Platform?: string
  platform?: string
  Likes?: number | string
  likes?: number | string
  Retweets?: number | string
  retweets?: number | string
  Sentiment?: string
  sentiment?: string
  Text?: string
  text?: string
  Hashtags?: string | string[]
  hashtags?: string | string[]
  Country?: string
  country?: string
}

/**
 * Parse timestamp to Date object
 */
function parseTimestamp(ts: any): Date {
  if (!ts) return new Date()
  
  // If already a Date object
  if (ts instanceof Date) return ts
  
  // If it's a number (Unix timestamp in seconds or milliseconds)
  if (typeof ts === 'number') {
    // Check if it's in seconds (< year 2100 in seconds)
    if (ts < 4102444800) {
      return new Date(ts * 1000)
    }
    return new Date(ts)
  }
  
  // If it's a string, try to parse it
  if (typeof ts === 'string') {
    const parsed = new Date(ts)
    if (!isNaN(parsed.getTime())) {
      return parsed
    }
  }
  
  // Fallback to current date
  console.warn(`Could not parse timestamp: ${ts}, using current date`)
  return new Date()
}

/**
 * Extract day of week from date
 * IMPORTANT: Uses UTC to match timestamp timezone
 * This ensures day/hour are consistent with the timestamp
 */
function getDayOfWeek(date: Date, useUTC: boolean = true): string {
  const dayIndex = useUTC ? date.getUTCDay() : date.getDay()
  return DAYS_OF_WEEK[dayIndex]
}

/**
 * Extract month name from date
 * IMPORTANT: Uses UTC to match timestamp timezone
 */
function getMonthName(date: Date, useUTC: boolean = true): string {
  const monthIndex = useUTC ? date.getUTCMonth() : date.getMonth()
  return MONTHS[monthIndex]
}

/**
 * Parse hashtags string to array
 */
function parseHashtags(hashtags: any): string[] {
  if (!hashtags) return []
  
  if (Array.isArray(hashtags)) {
    return hashtags.filter(h => h && typeof h === 'string').map(h => h.trim())
  }
  
  if (typeof hashtags === 'string') {
    // Split by comma, space, or pipe
    return hashtags
      .split(/[,|;]/)
      .map(h => h.trim().replace(/^#/, ''))
      .filter(h => h.length > 0)
  }
  
  return []
}

/**
 * Normalize platform name
 */
function normalizePlatform(platform: any): string {
  if (!platform) return 'unknown'
  
  const p = String(platform).toLowerCase().trim()
  
  // Map common variations
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

/**
 * Normalize sentiment
 */
function normalizeSentiment(sentiment: any): string {
  if (!sentiment) return 'neutral'
  
  const s = String(sentiment).toLowerCase().trim()
  
  if (s.includes('positive') || s === 'pos') return 'positive'
  if (s.includes('negative') || s === 'neg') return 'negative'
  return 'neutral'
}

/**
 * Convert number or string to number
 */
function toNumber(value: any): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''))
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

/**
 * Clean and transform a single record
 */
function transformRecord(raw: RawRecord): any {
  // Get timestamp (case-insensitive)
  const timestamp = parseTimestamp(raw.Timestamp || raw.timestamp || raw.date || raw.Date)
  const date = new Date(timestamp)
  
  // Extract date components using UTC to match timestamp timezone
  // CRITICAL: timestamp is stored in UTC, so day/hour/month must also be UTC
  // This ensures consistency - the day and hour will match the timestamp's actual timezone
  const year = date.getUTCFullYear()
  const month = getMonthName(date, true) // Use UTC month
  const day = date.getUTCDate()
  const hour = date.getUTCHours() // Use UTC hour to match timestamp
  const dayOfWeek = getDayOfWeek(date, true) // Use UTC day to match timestamp
  
  // Get platform (case-insensitive)
  const platform = normalizePlatform(raw.Platform || raw.platform)
  
  // Get likes and retweets
  const likes = toNumber(raw.Likes || raw.likes || 0)
  const retweets = toNumber(raw.Retweets || raw.retweets || 0)
  
  // Calculate engagement
  const engagement = likes + retweets
  
  // Get sentiment
  const sentiment = normalizeSentiment(raw.Sentiment || raw.sentiment)
  
  // Get text
  const text = String(raw.Text || raw.text || raw.content || '').trim()
  
  // Get hashtags
  const hashtags = parseHashtags(raw.Hashtags || raw.hashtags || raw.hashtag)
  
  // Get country
  const country = String(raw.Country || raw.country || '').trim() || undefined
  
  return {
    timestamp: date,
    platform,
    likes,
    retweets,
    sentiment,
    text,
    hashtags,
    country,
    engagementScore: engagement,
    // Derived fields
    day: dayOfWeek,
    month,
    hour,
    year,
    dayOfMonth: day,
  }
}

/**
 * Ingest data from CSV/JSON file
 */
async function ingestData(filePath: string) {
  try {
    console.log(`\n📊 Starting data ingestion from: ${filePath}`)
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')
    
    // Clear existing data (optional - comment out if you want to append)
    const existingCount = await PredictionBestTime.countDocuments({})
    console.log(`📋 Existing documents in collection: ${existingCount}`)
    
    if (existingCount > 0) {
      console.log('⚠️  Collection already has data. Clearing...')
      await PredictionBestTime.deleteMany({})
      console.log('✅ Cleared existing data')
    }
    
    // Read file
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const fileExt = path.extname(filePath).toLowerCase()
    
    let records: RawRecord[] = []
    
    if (fileExt === '.json') {
      // Parse JSON
      const jsonData = JSON.parse(fileContent)
      records = Array.isArray(jsonData) ? jsonData : [jsonData]
    } else if (fileExt === '.csv') {
      // Parse CSV (simple parser - use a library like csv-parse for production)
      const lines = fileContent.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
      
      records = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        const record: RawRecord = {}
        headers.forEach((header, index) => {
          // Drop Unnamed columns
          if (header.startsWith('Unnamed')) {
            return
          }
          record[header] = values[index]
        })
        return record
      })
    } else {
      throw new Error(`Unsupported file format: ${fileExt}. Use .json or .csv`)
    }
    
    console.log(`📄 Loaded ${records.length} raw records`)
    
    // Transform and clean records
    const transformedRecords = records
      .filter(record => {
        // Filter out records with missing essential fields
        const hasTimestamp = !!(record.Timestamp || record.timestamp || record.date || record.Date)
        const hasPlatform = !!(record.Platform || record.platform)
        return hasTimestamp && hasPlatform
      })
      .map(transformRecord)
    
    console.log(`✨ Transformed ${transformedRecords.length} records`)
    
    // Insert in batches
    const batchSize = 1000
    let inserted = 0
    
    for (let i = 0; i < transformedRecords.length; i += batchSize) {
      const batch = transformedRecords.slice(i, i + batchSize)
      await PredictionBestTime.insertMany(batch, { ordered: false })
      inserted += batch.length
      console.log(`📥 Inserted ${inserted}/${transformedRecords.length} records...`)
    }
    
    console.log(`\n✅ Successfully ingested ${inserted} records`)
    
    // Verify indexes
    console.log('\n📑 Verifying indexes...')
    const indexes = await PredictionBestTime.collection.getIndexes()
    console.log('Current indexes:', Object.keys(indexes))
    
    // Create indexes if they don't exist
    console.log('\n🔧 Creating indexes...')
    await PredictionBestTime.collection.createIndex({ platform: 1, timestamp: 1 })
    await PredictionBestTime.collection.createIndex({ platform: 1, day: 1, hour: 1 })
    await PredictionBestTime.collection.createIndex({ platform: 1, hour: 1 })
    await PredictionBestTime.collection.createIndex({ country: 1, platform: 1 })
    await PredictionBestTime.collection.createIndex({ sentiment: 1, platform: 1 })
    await PredictionBestTime.collection.createIndex({ sentiment: 1, platform: 1, hour: 1 })
    await PredictionBestTime.collection.createIndex({ country: 1, platform: 1, hour: 1 })
    await PredictionBestTime.collection.createIndex({ engagementScore: -1 })
    console.log('✅ Indexes created')
    
    // Print summary statistics
    console.log('\n📊 Data Summary:')
    const totalCount = await PredictionBestTime.countDocuments({})
    console.log(`Total records: ${totalCount}`)
    
    const platformCounts = await PredictionBestTime.aggregate([
      { $group: { _id: '$platform', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
    console.log('\nRecords by platform:')
    platformCounts.forEach((p: any) => {
      console.log(`  ${p._id}: ${p.count}`)
    })
    
    const sentimentCounts = await PredictionBestTime.aggregate([
      { $group: { _id: '$sentiment', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
    console.log('\nRecords by sentiment:')
    sentimentCounts.forEach((s: any) => {
      console.log(`  ${s._id}: ${s.count}`)
    })
    
    const dateRange = await PredictionBestTime.aggregate([
      { $group: { _id: null, minDate: { $min: '$timestamp' }, maxDate: { $max: '$timestamp' } } }
    ])
    if (dateRange.length > 0) {
      console.log(`\nDate range: ${dateRange[0].minDate} to ${dateRange[0].maxDate}`)
    }
    
    console.log('\n✅ Data ingestion complete!')
    
  } catch (error: any) {
    console.error('❌ Error during ingestion:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
  }
}

// Main execution
const filePath = process.argv[2]

if (!filePath) {
  console.error('Usage: tsx ingestPredictionBestTime.ts <path-to-data-file.json|csv>')
  console.error('Example: tsx ingestPredictionBestTime.ts ./data/prediction_best_time.csv')
  process.exit(1)
}

if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`)
  process.exit(1)
}

ingestData(filePath)
  .then(() => {
    console.log('\n🎉 Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })



