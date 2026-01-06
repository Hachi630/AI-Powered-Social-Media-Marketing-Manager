// Quick diagnostic script: Check database connection and user data
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/melo';

async function checkDatabase() {
  try {
    console.log('\n🔍 Starting database connection diagnosis...\n');
    console.log(`📡 Connection string: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}\n`);

    // Connect to database
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ Database connected successfully!\n');
    console.log(`📊 Database name: ${mongoose.connection.db?.databaseName || 'unknown'}\n`);

    // Check User collection
    const User = mongoose.connection.db.collection('users');
    const userCount = await User.countDocuments();
    console.log(`👥 Total users: ${userCount}\n`);

    if (userCount > 0) {
      console.log('📋 User list (first 10):');
      const users = await User.find({}).limit(10).toArray();
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. Email: ${user.email}`);
        console.log(`   Password: ${user.password ? '***set***' : 'not set'}`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Created at: ${user.createdAt || 'unknown'}`);
      });
    } else {
      console.log('⚠️  No users in database. Please register a user first.\n');
    }

    // Test query for specific email
    const testEmail = process.argv[2];
    if (testEmail) {
      const normalizedEmail = testEmail.toLowerCase().trim();
      console.log(`\n🔎 Searching for email: ${normalizedEmail}`);
      const user = await User.findOne({ email: normalizedEmail });
      if (user) {
        console.log('✅ User found:');
        console.log(`   Email: ${user.email}`);
        console.log(`   Password: ${user.password || 'not set'}`);
        console.log(`   ID: ${user._id}`);
      } else {
        console.log('❌ User not found');
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Diagnosis completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database connection failed:');
    console.error(error.message);
    if (error.message.includes('authentication failed')) {
      console.error('\n💡 Tip: Please check if MongoDB username and password are correct');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('\n💡 Tip: Please check if the hostname in MongoDB URI is correct');
    } else if (error.message.includes('timeout')) {
      console.error('\n💡 Tip: Please check network connection and MongoDB Atlas IP whitelist settings');
    }
    process.exit(1);
  }
}

checkDatabase();

