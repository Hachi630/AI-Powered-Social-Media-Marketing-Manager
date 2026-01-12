import mongoose from 'mongoose'
import dotenv from 'dotenv'
import {
  getBestHoursPerPlatform,
  getBestDaysPerPlatform,
  getDayHourHeatmap,
  getEngagementMetrics,
  getTopPosts,
  getSentimentInsights,
  getPlatformComparison,
  getHashtagTrends,
  getCountryInsights,
} from '../src/services/bestTimeAnalyticsService'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/melo'

async function testAnalytics() {
  try {
    console.log('🧪 Testing Best Time Analytics API Functions...\n')
    
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')
    
    // Test each function
    console.log('1️⃣ Testing getBestHoursPerPlatform...')
    const bestHours = await getBestHoursPerPlatform()
    console.log('   Result:', {
      platforms: Object.keys(bestHours),
      sample: bestHours[Object.keys(bestHours)[0]]?.slice(0, 2)
    })
    console.log('')
    
    console.log('2️⃣ Testing getBestDaysPerPlatform...')
    const bestDays = await getBestDaysPerPlatform()
    console.log('   Result:', {
      platforms: Object.keys(bestDays),
      sample: bestDays[Object.keys(bestDays)[0]]?.slice(0, 2)
    })
    console.log('')
    
    console.log('3️⃣ Testing getDayHourHeatmap...')
    const heatmap = await getDayHourHeatmap()
    console.log('   Result:', {
      platforms: Object.keys(heatmap),
      sampleCount: heatmap[Object.keys(heatmap)[0]]?.length || 0
    })
    console.log('')
    
    console.log('4️⃣ Testing getEngagementMetrics...')
    const engagement = await getEngagementMetrics()
    console.log('   Result:', {
      count: engagement.length,
      sample: engagement[0]
    })
    console.log('')
    
    console.log('5️⃣ Testing getTopPosts...')
    const topPosts = await getTopPosts(5)
    console.log('   Result:', {
      count: topPosts.length,
      sample: topPosts[0]
    })
    console.log('')
    
    console.log('6️⃣ Testing getSentimentInsights...')
    const sentiment = await getSentimentInsights()
    console.log('   Result:', {
      count: sentiment.length,
      sample: sentiment[0]
    })
    console.log('')
    
    console.log('7️⃣ Testing getPlatformComparison...')
    const platformComp = await getPlatformComparison()
    console.log('   Result:', {
      count: platformComp.length,
      sample: platformComp[0]
    })
    console.log('')
    
    console.log('8️⃣ Testing getHashtagTrends...')
    const hashtags = await getHashtagTrends(5)
    console.log('   Result:', {
      count: hashtags.length,
      sample: hashtags[0]
    })
    console.log('')
    
    console.log('9️⃣ Testing getCountryInsights...')
    const countries = await getCountryInsights()
    console.log('   Result:', {
      count: countries.length,
      sample: countries[0]
    })
    console.log('')
    
    // Test the combined endpoint structure
    console.log('🔟 Testing combined endpoint structure...')
    const allData = {
      bestHours,
      bestDays,
      heatmap,
      engagement,
      topPosts,
      sentiment,
      platformComparison: platformComp,
      hashtags,
      countries,
    }
    
    console.log('Combined data structure:')
    console.log(JSON.stringify({
      bestHours: Object.keys(allData.bestHours).length,
      bestDays: Object.keys(allData.bestDays).length,
      heatmap: Object.keys(allData.heatmap).length,
      engagement: allData.engagement.length,
      topPosts: allData.topPosts.length,
      sentiment: allData.sentiment.length,
      platformComparison: allData.platformComparison.length,
      hashtags: allData.hashtags.length,
      countries: allData.countries.length,
    }, null, 2))
    
    console.log('\n✅ All tests completed!')
    console.log('\n💡 If all functions return data, the issue might be in the frontend rendering.')
    console.log('   Check browser console for API response logs.')
    
  } catch (error: any) {
    console.error('❌ Error:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

testAnalytics()



