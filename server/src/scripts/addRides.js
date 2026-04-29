const mongoose = require('mongoose');

// Define simplified schemas for our data
const userSchema = new mongoose.Schema({
  email: String,
  username: String,
  name: String,
  phone: String,
  role: String,
  walletBalance: Number,
  isVerified: Boolean,
  status: String,
}, { timestamps: true });

const stationSchema = new mongoose.Schema({
  name: String,
  location: {
    type: { type: String },
    coordinates: [Number]
  },
  capacity: Number,
  availableCycles: Number,
  status: String,
  facilities: [String]
}, { timestamps: true });

const cycleSchema = new mongoose.Schema({
  code: String,
  model: String,
  batteryLevel: Number,
  status: String,
  location: {
    type: { type: String },
    coordinates: [Number]
  },
  station: mongoose.Schema.Types.ObjectId,
  qrCode: String,
  imageUrl: String,
  totalRides: Number,
  totalDistance: Number
}, { timestamps: true });

const bookingSchema = new mongoose.Schema({
  user: mongoose.Schema.Types.ObjectId,
  cycle: mongoose.Schema.Types.ObjectId,
  startStation: mongoose.Schema.Types.ObjectId,
  endStation: mongoose.Schema.Types.ObjectId,
  status: String,
  startTime: Date,
  endTime: Date,
  duration: Number,
  estimatedCost: Number,
  paymentStatus: String
}, { timestamps: true });

const rideSchema = new mongoose.Schema({
  booking: mongoose.Schema.Types.ObjectId,
  user: mongoose.Schema.Types.ObjectId,
  cycle: mongoose.Schema.Types.ObjectId,
  status: String,
  startLocation: {
    type: { type: String },
    coordinates: [Number]
  },
  endLocation: {
    type: { type: String },
    coordinates: [Number]
  },
  route: [{
    location: {
      type: { type: String },
      coordinates: [Number]
    },
    timestamp: Date
  }],
  startTime: Date,
  endTime: Date,
  distance: Number,
  duration: Number,
  cost: Number
}, { timestamps: true });

// Create models
const User = mongoose.model('User', userSchema);
const Station = mongoose.model('Station', stationSchema);
const Cycle = mongoose.model('Cycle', cycleSchema);
const Booking = mongoose.model('Booking', bookingSchema);
const Ride = mongoose.model('Ride', rideSchema);

const addRides = async () => {
  try {
    // Connect to the same database as the server
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cycles';
    console.log(`🔌 Attempting to connect to MongoDB at: ${mongoUri}`);
    
    const conn = await mongoose.connect(mongoUri);
    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);

    // Get existing users, cycles, and stations
    const users = await User.find({ role: 'USER' });
    const cycles = await Cycle.find({ status: 'AVAILABLE' }).limit(10);
    const stations = await Station.find().limit(5);

    if (users.length === 0 || cycles.length === 0 || stations.length === 0) {
      console.log('❌ Not enough data to create rides. Please seed the database first.');
      await mongoose.connection.close();
      return;
    }

    console.log(`👥 Found ${users.length} users, ${cycles.length} cycles, ${stations.length} stations`);

    // Create some bookings first (required for rides)
    const bookings = [];
    for (let i = 0; i < 8; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const cycle = cycles[Math.floor(Math.random() * cycles.length)];
      const startStation = stations[Math.floor(Math.random() * stations.length)];
      const endStation = stations[Math.floor(Math.random() * stations.length)];
      
      // Random start time within the last 7 days
      const startTime = new Date();
      startTime.setDate(startTime.getDate() - Math.floor(Math.random() * 7));
      
      // Random end time (30 min to 2 hours after start)
      const durationMinutes = 30 + Math.floor(Math.random() * 90);
      const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
      
      const booking = new Booking({
        user: user._id,
        cycle: cycle._id,
        startStation: startStation._id,
        endStation: endStation._id,
        startTime: startTime,
        endTime: endTime,
        duration: durationMinutes * 60, // in seconds
        estimatedCost: 10 + Math.floor(Math.random() * 40), // ₹10-50
        status: 'CONFIRMED',
        paymentStatus: 'PAID'
      });
      
      await booking.save();
      bookings.push(booking);
    }
    
    console.log(`🎫 Created ${bookings.length} bookings`);

    // Create completed rides
    const completedRides = [];
    for (let i = 0; i < 5; i++) {
      const booking = bookings[i];
      const startTime = new Date(booking.startTime);
      const endTime = new Date(booking.endTime);
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      // Random distance between 1-5 km
      const distance = 1 + Math.random() * 4;
      
      // Calculate cost: ₹2 per minute + ₹0.5 per 100m
      const timeCost = (duration / 60) * 2;
      const distanceCost = (distance * 1000 / 100) * 0.5;
      const totalCost = Math.max(timeCost + distanceCost, 10); // Minimum ₹10
      
      const ride = new Ride({
        booking: booking._id,
        user: booking.user,
        cycle: booking.cycle,
        status: 'COMPLETED',
        startLocation: {
          type: 'Point',
          coordinates: [
            stations[Math.floor(Math.random() * stations.length)].location.coordinates[0] + (Math.random() - 0.5) * 0.002,
            stations[Math.floor(Math.random() * stations.length)].location.coordinates[1] + (Math.random() - 0.5) * 0.002
          ]
        },
        endLocation: {
          type: 'Point',
          coordinates: [
            stations[Math.floor(Math.random() * stations.length)].location.coordinates[0] + (Math.random() - 0.5) * 0.002,
            stations[Math.floor(Math.random() * stations.length)].location.coordinates[1] + (Math.random() - 0.5) * 0.002
          ]
        },
        route: [], // Simplified for this script
        startTime: startTime,
        endTime: endTime,
        distance: distance,
        duration: duration,
        cost: totalCost
      });
      
      await ride.save();
      completedRides.push(ride);
      
      // Update cycle status
      await Cycle.findByIdAndUpdate(booking.cycle, {
        status: 'AVAILABLE',
        $inc: { totalRides: 1, totalDistance: distance }
      });
      
      // Deduct cost from user wallet
      await User.findByIdAndUpdate(booking.user, {
        $inc: { walletBalance: -totalCost }
      });
    }
    
    console.log(`🏁 Created ${completedRides.length} completed rides`);

    // Create active rides
    const activeRides = [];
    for (let i = 5; i < 8 && i < bookings.length; i++) {
      const booking = bookings[i];
      const startTime = new Date(booking.startTime);
      
      // Active rides don't have end time yet
      const ride = new Ride({
        booking: booking._id,
        user: booking.user,
        cycle: booking.cycle,
        status: 'ACTIVE',
        startLocation: {
          type: 'Point',
          coordinates: [
            stations[Math.floor(Math.random() * stations.length)].location.coordinates[0] + (Math.random() - 0.5) * 0.002,
            stations[Math.floor(Math.random() * stations.length)].location.coordinates[1] + (Math.random() - 0.5) * 0.002
          ]
        },
        route: [], // Simplified for this script
        startTime: startTime,
        distance: 0,
        duration: 0,
        cost: 0
      });
      
      await ride.save();
      activeRides.push(ride);
      
      // Update cycle status to IN_USE
      await Cycle.findByIdAndUpdate(booking.cycle, {
        status: 'IN_USE'
      });
    }
    
    console.log(`🚴 Created ${activeRides.length} active rides`);

    console.log(`
🎉 Successfully added ride data!
📊 Summary:
   • ${bookings.length} bookings created
   • ${completedRides.length} completed rides
   • ${activeRides.length} active rides
   • Revenue generated: ₹${completedRides.reduce((sum, ride) => sum + ride.cost, 0).toFixed(2)}
    `);

  } catch (error) {
    console.error('❌ Error adding rides:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the function
addRides().catch(console.error);