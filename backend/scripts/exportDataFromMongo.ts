import mongoose from 'mongoose'
import dotenv from 'dotenv'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/melo'

/**
 * Export data from MongoDB collection to JSON file
 * This can help if data exists in a different format or collection
 */
async function exportData() {
  try {
    console.log('📤 Exporting data from MongoDB...\n')
    
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')
    
    const db = mongoose.connection.db
    const collection = db.collection('prediction_best_time')
    
    // Check if collection exists
    const collections = await db.listCollections().toArray()
    const collectionExists = collections.some(c => c.name === 'prediction_best_time')
    
    if (!collectionExists) {
      console.log('⚠️  Collection "prediction_best_time" does not exist')
      console.log('\nAvailable collections:')
      collections.forEach(c => console.log(`  - ${c.name}`))
      await mongoose.disconnect()
      return
    }
    
    const count = await collection.countDocuments({})
    console.log(`📊 Found ${count} documents in prediction_best_time collection\n`)
    
    if (count === 0) {
      console.log('⚠️  Collection is empty. No data to export.')
      console.log('\n💡 You need to import data from a CSV or JSON file.')
      console.log('   Do you have a data file? If so, provide the path to it.')
      await mongoose.disconnect()
      return
    }
    
    // Export to JSON
    const documents = await collection.find({}).toArray()
    const outputPath = path.join(__dirname, '../data_export.json')
    
    fs.writeFileSync(outputPath, JSON.stringify(documents, null, 2))
    console.log(`✅ Exported ${documents.length} documents to: ${outputPath}`)
    console.log('\n📄 You can now review the data structure in the exported file.')
    
    // Show sample structure
    if (documents.length > 0) {
      console.log('\n📋 Sample document structure:')
      console.log(JSON.stringify(documents[0], null, 2))
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

exportData()



