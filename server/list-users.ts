import { User } from './src/models/User.js';
import { connectDB } from './src/config/database.js';
import mongoose from 'mongoose';

async function listUsers() {
  try {
    // Connect to database
    await connectDB();
    
    // Find all users
    const users = await User.find({});
    
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ${user.role} - Verified: ${user.isVerified}`);
    });
    
    // Close connection
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

listUsers();