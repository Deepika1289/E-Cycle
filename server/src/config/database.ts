import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    // Default DB changed to 'cycles' to match seed script output and seeded data
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cycles';
    console.log(`🔌 Attempting to connect to MongoDB at: ${mongoUri}`);
    
    const conn = await mongoose.connect(mongoUri);
    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
    
    // Check if we need to seed initial data (only if collections are empty)
    const collections = await mongoose.connection.db.listCollections().toArray();
    const usersCollection = collections.find(c => c.name === 'users');
    const stationsCollection = collections.find(c => c.name === 'stations');
    const cyclesCollection = collections.find(c => c.name === 'cycles');
    
    // Only log collection status, don't auto-seed
    if (usersCollection) {
      const userCount = await mongoose.connection.db.collection('users').countDocuments();
      console.log(`👥 Users collection has ${userCount} documents`);
    }
    
    if (stationsCollection) {
      const stationCount = await mongoose.connection.db.collection('stations').countDocuments();
      console.log(`🏢 Stations collection has ${stationCount} documents`);
    }
    
    if (cyclesCollection) {
      const cycleCount = await mongoose.connection.db.collection('cycles').countDocuments();
      console.log(`🚲 Cycles collection has ${cycleCount} documents`);
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
    console.log('💡 Make sure MongoDB is running or set MONGODB_URI environment variable');
    console.log('🚀 Starting server without database connection...');
    
    // Don't exit the process, let the server start without DB
    // process.exit(1);
  }
};