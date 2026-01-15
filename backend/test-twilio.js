// Quick test script to verify Twilio credentials
// Run with: node test-twilio.js

import twilio from 'twilio'
import dotenv from 'dotenv'

dotenv.config()

const accountSid = process.env.TWILIO_ACCOUNT_SID || 'YOUR_TWILIO_ACCOUNT_SID'
const authToken = process.env.TWILIO_AUTH_TOKEN || 'YOUR_TWILIO_AUTH_TOKEN'

console.log('Testing Twilio credentials...')
console.log('Account SID:', accountSid.substring(0, 4) + '...')
console.log('Auth Token:', authToken.substring(0, 4) + '...')

try {
  const client = twilio(accountSid, authToken)
  
  // Try to fetch account info to verify credentials
  const account = await client.api.accounts(accountSid).fetch()
  
  console.log('✅ Twilio credentials are valid!')
  console.log('Account Name:', account.friendlyName)
  console.log('Account Status:', account.status)
} catch (error) {
  console.error('❌ Twilio authentication failed!')
  console.error('Error Code:', error.code)
  console.error('Error Message:', error.message)
  console.error('\nPlease check:')
  console.error('1. Account SID is correct')
  console.error('2. Auth Token is correct')
  console.error('3. Credentials are from the same Twilio account')
  console.error('4. Auth Token has not been regenerated')
  process.exit(1)
}







