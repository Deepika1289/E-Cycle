import { User } from './src/models/User.js';
import { OtpModel } from './src/models/Otp.js';
import { generateNumericOtp, hashOtp } from './src/utils/otp.js';
import { connectDB } from './src/config/database.js';
import mongoose from 'mongoose';

async function createTestOtp() {
  try {
    // Connect to database
    await connectDB();
    
    // Find the test user
    const user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      console.log('❌ Test user not found');
      return;
    }
    
    console.log(`✅ Found user: ${user.name} (${user.email})`);
    
    // Generate OTP
    const otp = generateNumericOtp(6);
    const hashed = await hashOtp(otp);
    
    console.log(`🔐 Generated OTP: ${otp}`);
    
    // Store in database
    const expiresAt = new Date(Date.now() + 120 * 1000); // 2 minutes
    await OtpModel.findOneAndUpdate(
      { email: user.email },
      { 
        otp_code: otp,
        hash: hashed, 
        attempts: 0, 
        is_verified: false,
        createdAt: new Date(), 
        expiresAt,
        expiry_time: expiresAt
      },
      { upsert: true, new: true }
    );
    
    console.log('✅ OTP stored in database');
    console.log(`📝 Use this OTP to login: ${otp}`);
    
    // Close connection
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestOtp();