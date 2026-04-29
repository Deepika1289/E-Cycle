const mongoose = require('mongoose');

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cycles';
console.log(`🔌 Attempting to connect to MongoDB at: ${mongoUri}`);

mongoose.connect(mongoUri).then(async () => {
  console.log(`📦 MongoDB Connected: ${mongoose.connection.host}`);
  
  // Get collections
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('\n📋 Collections in database:');
  collections.forEach(collection => {
    console.log(`  - ${collection.name}`);
  });
  
  // Get document counts
  const userCount = await mongoose.connection.db.collection('users').countDocuments();
  const cycleCount = await mongoose.connection.db.collection('cycles').countDocuments();
  const rideCount = await mongoose.connection.db.collection('rides').countDocuments();
  const paymentCount = await mongoose.connection.db.collection('payments').countDocuments();
  const stationCount = await mongoose.connection.db.collection('stations').countDocuments();
  
  console.log(`
📊 Document Counts:
===================
👥 Users: ${userCount}
🚲 Cycles: ${cycleCount}
🏁 Rides: ${rideCount}
💳 Payments: ${paymentCount}
🏢 Stations: ${stationCount}
`);
  
  // Get ride stats
  const activeRides = await mongoose.connection.db.collection('rides').countDocuments({ status: 'ACTIVE' });
  console.log(`🚴 Active Rides: ${activeRides}`);
  
  // Get revenue from completed payments
  const payments = await mongoose.connection.db.collection('payments').find({ status: 'COMPLETED', type: 'RIDE' }).toArray();
  const totalRevenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  console.log(`💰 Total Revenue: ₹${totalRevenue.toFixed(2)}`);
  
  // Show recent rides
  console.log('\n🏁 Recent Rides:');
  const recentRides = await mongoose.connection.db.collection('rides')
    .find({})
    .sort({ startTime: -1 })
    .limit(5)
    .toArray();
    
  recentRides.forEach((ride, index) => {
    console.log(`${index + 1}. Status: ${ride.status} | Cost: ₹${ride.cost || 0} | Duration: ${ride.duration || 0}s | Distance: ${(ride.distance || 0).toFixed(2)}km`);
  });
  
  // Show recent payments
  console.log('\n💳 Recent Payments:');
  const recentPayments = await mongoose.connection.db.collection('payments')
    .find({ status: 'COMPLETED' })
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();
    
  recentPayments.forEach((payment, index) => {
    console.log(`${index + 1}. Type: ${payment.type} | Amount: ₹${payment.amount || 0} | Method: ${payment.method || 'N/A'}`);
  });
  
  mongoose.connection.close();
}).catch(err => {
  console.error('❌ Error connecting to MongoDB:', err);
});