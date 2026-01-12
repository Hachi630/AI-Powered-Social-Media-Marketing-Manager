import mongoose from 'mongoose'
import dotenv from 'dotenv'
import PredictionBestTime from '../src/models/PredictionBestTime'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/melo'

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function getDayOfWeek(date: Date): string {
  return DAYS_OF_WEEK[date.getUTCDay()]
}

function getMonthName(date: Date): string {
  return MONTHS[date.getUTCMonth()]
}

/**
 * Fix timezone mismatch in existing data
 * Recomputes day/hour/month from timestamp using UTC consistently
 */
async function fixTimezoneMismatch() {
  try {
    console.log('🔧 Fixing timezone mismatch in prediction_best_time collection...\n')
    
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')
    
    const db = mongoose.connection.db
    const collection = db.collection('prediction_best_time')
    
    const totalCount = await collection.countDocuments({})
    console.log(`📊 Found ${totalCount} documents to check\n`)
    
    if (totalCount === 0) {
      console.log('⚠️  No documents found.')
      await mongoose.disconnect()
      return
    }
    
    // Process documents in batches
    const batchSize = 100
    let processed = 0
    let fixed = 0
    
    const cursor = collection.find({})
    
    console.log('🔄 Checking and fixing timezone mismatches...\n')
    
    while (await cursor.hasNext()) {
      const batch: any[] = []
      
      // Collect a batch
      for (let i = 0; i < batchSize && await cursor.hasNext(); i++) {
        batch.push(await cursor.next())
      }
      
      // Check and fix each document
      const operations = batch.map((doc: any) => {
        try {
          if (!doc.timestamp || !(doc.timestamp instanceof Date)) {
            return null
          }
          
          const date = new Date(doc.timestamp)
          
          // Recompute using UTC (matching timestamp timezone)
          const correctYear = date.getUTCFullYear()
          const correctMonth = getMonthName(date)
          const correctDayOfMonth = date.getUTCDate()
          const correctHour = date.getUTCHours()
          const correctDay = getDayOfWeek(date)
          
          // Check if values need fixing
          const needsFix = 
            doc.year !== correctYear ||
            doc.month !== correctMonth ||
            doc.dayOfMonth !== correctDayOfMonth ||
            doc.hour !== correctHour ||
            doc.day !== correctDay
          
          if (!needsFix) {
            return null // No fix needed
          }
          
          // Update with correct UTC values
          return {
            updateOne: {
              filter: { _id: doc._id },
              update: {
                $set: {
                  year: correctYear,
                  month: correctMonth,
                  dayOfMonth: correctDayOfMonth,
                  hour: correctHour,
                  day: correctDay,
                }
              },
            }
          }
        } catch (error: any) {
          console.error(`Error processing document ${doc._id}:`, error.message)
          return null
        }
      }).filter(op => op !== null)
      
      // Execute batch update
      if (operations.length > 0) {
        const result = await collection.bulkWrite(operations)
        fixed += result.modifiedCount
        processed += batch.length
        console.log(`✅ Processed ${processed}/${totalCount} documents (${fixed} fixed)...`)
      } else {
        processed += batch.length
        if (processed % 100 === 0) {
          console.log(`✅ Processed ${processed}/${totalCount} documents (no fixes needed)...`)
        }
      }
    }
    
    console.log(`\n✅ Timezone fix complete!`)
    console.log(`   Processed: ${processed} documents`)
    console.log(`   Fixed: ${fixed} documents`)
    
    if (fixed > 0) {
      // Verify a sample
      console.log('\n🔍 Verifying fix...\n')
      const sample = await collection.findOne({})
      if (sample) {
        const date = new Date(sample.timestamp)
        console.log('Sample document after fix:')
        console.log(`  Timestamp: ${sample.timestamp}`)
        console.log(`  Day: ${sample.day} (should be ${getDayOfWeek(date)})`)
        console.log(`  Hour: ${sample.hour} (should be ${date.getUTCHours()})`)
        console.log(`  Match: ${sample.day === getDayOfWeek(date) && sample.hour === date.getUTCHours() ? '✅' : '❌'}`)
      }
    }
    
    console.log('\n✅ Done! Day and hour now match the timestamp timezone.')
    
  } catch (error: any) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

fixTimezoneMismatch()
  .then(() => {
    console.log('\n🎉 Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })



