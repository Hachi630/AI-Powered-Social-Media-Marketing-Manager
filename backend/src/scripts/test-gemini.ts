/**
 * Test script for Gemini API integration
 * 
 * Usage:
 *   tsx src/scripts/test-gemini.ts
 * 
 * Make sure GEMINI_API_KEY is set in your .env file
 */

import dotenv from 'dotenv'
import { geminiService } from '../services/geminiService.js'

// Load environment variables
dotenv.config()

async function testGeminiAPI() {
  console.log('🧪 Testing Gemini API Integration\n')
  console.log('=' .repeat(50))

  // Check environment variables
  console.log('\n📋 Environment Check:')
  console.log(`  GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing'}`)
  console.log(`  GEMINI_MODEL: ${process.env.GEMINI_MODEL || 'gemini-2.5-flash (default)'}`)
  console.log(`  MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Missing'}`)

  if (!process.env.GEMINI_API_KEY) {
    console.error('\n❌ Error: GEMINI_API_KEY is not set in environment variables')
    console.log('   Please add GEMINI_API_KEY to your .env file')
    process.exit(1)
  }

  // Test 1: Simple message without context
  console.log('\n\n🧪 Test 1: Simple Message (No Context)')
  console.log('-'.repeat(50))
  try {
    const response1 = await geminiService.generateContent({
      messages: [
        {
          role: 'user',
          content: 'Hello! Can you tell me a short joke?',
        },
      ],
    })
    console.log('✅ Success!')
    console.log(`Response: ${response1.substring(0, 200)}${response1.length > 200 ? '...' : ''}`)
  } catch (error: any) {
    console.error('❌ Failed:', error.message)
    console.error('Stack:', error.stack)
  }

  // Test 2: Message with user context
  console.log('\n\n🧪 Test 2: Message with Brand Context')
  console.log('-'.repeat(50))
  try {
    const response2 = await geminiService.generateContent({
      messages: [
        {
          role: 'user',
          content: 'What should I know about my brand?',
        },
      ],
      userContext: {
        brandName: 'Test Brand',
        industry: 'Technology',
        toneOfVoice: 'warm',
        knowledgeProducts: ['Product A', 'Product B'],
        targetAudience: ['Developers', 'Tech Enthusiasts'],
      },
    })
    console.log('✅ Success!')
    console.log(`Response: ${response2.substring(0, 200)}${response2.length > 200 ? '...' : ''}`)
  } catch (error: any) {
    console.error('❌ Failed:', error.message)
    console.error('Stack:', error.stack)
  }

  // Test 3: Conversation with history
  console.log('\n\n🧪 Test 3: Conversation with History')
  console.log('-'.repeat(50))
  try {
    const response3 = await geminiService.generateContent({
      messages: [
        {
          role: 'user',
          content: 'My name is Alice',
        },
        {
          role: 'assistant',
          content: 'Nice to meet you, Alice! How can I help you today?',
        },
        {
          role: 'user',
          content: 'What is my name?',
        },
      ],
    })
    console.log('✅ Success!')
    console.log(`Response: ${response3.substring(0, 200)}${response3.length > 200 ? '...' : ''}`)
    
    // Check if response remembers the name
    if (response3.toLowerCase().includes('alice')) {
      console.log('✅ Context retention: Response remembers the name!')
    } else {
      console.log('⚠️  Context retention: Response may not have remembered the name')
    }
  } catch (error: any) {
    console.error('❌ Failed:', error.message)
    console.error('Stack:', error.stack)
  }

  // Test 4: Error handling - empty message
  console.log('\n\n🧪 Test 4: Error Handling (Empty Messages)')
  console.log('-'.repeat(50))
  try {
    await geminiService.generateContent({
      messages: [],
    })
    console.log('⚠️  Warning: Should have thrown an error for empty messages')
  } catch (error: any) {
    console.log('✅ Error handling works:', error.message)
  }

  // Test 5: Long message
  console.log('\n\n🧪 Test 5: Long Message')
  console.log('-'.repeat(50))
  try {
    const longMessage = 'Tell me a story about a developer who built an amazing application. ' + 
      'Make it detailed and engaging. '.repeat(5)
    
    const response5 = await geminiService.generateContent({
      messages: [
        {
          role: 'user',
          content: longMessage,
        },
      ],
    })
    console.log('✅ Success!')
    console.log(`Response length: ${response5.length} characters`)
    console.log(`Response preview: ${response5.substring(0, 150)}...`)
  } catch (error: any) {
    console.error('❌ Failed:', error.message)
  }

  console.log('\n\n' + '='.repeat(50))
  console.log('✨ Testing Complete!')
  console.log('='.repeat(50) + '\n')
}

// Run tests
testGeminiAPI()
  .then(() => {
    console.log('All tests completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Test suite failed:', error)
    process.exit(1)
  })

