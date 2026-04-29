import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { User } from '../models/User.js';
import { Station } from '../models/Station.js';
import { Cycle } from '../models/Cycle.js';
import { connectDB } from '../config/database.js';

const seedData = async () => {
  try {
    // Connect to the same database as the server
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cycles';
    console.log(`🔌 Attempting to connect to MongoDB at: ${mongoUri}`);
    
    const conn = await mongoose.connect(mongoUri);
    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
    
    // Safety check - only proceed with seeding if explicitly confirmed
    const shouldSeed = process.env.SHOULD_SEED === 'true' || process.argv.includes('--force');
    
    if (!shouldSeed) {
      // Check if collections already have data
      const userCount = await User.countDocuments();
      const stationCount = await Station.countDocuments();
      const cycleCount = await Cycle.countDocuments();
      
      if (userCount > 0 || stationCount > 0 || cycleCount > 0) {
        console.log('⚠️  Database already contains data. Skipping seed to preserve existing data.');
        console.log(`📊 Current data: ${userCount} users, ${stationCount} stations, ${cycleCount} cycles`);
        console.log('💡 To force seeding, run with --force flag or set SHOULD_SEED=true environment variable');
        await mongoose.connection.close();
        return;
      }
    }
    
    // Clear existing data (only if forced or database is empty)
    console.log('🗑️ Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Station.deleteMany({}),
      Cycle.deleteMany({})
    ]);

    console.log('🗑️ Cleared existing data');

    // Create users (aligned with role-based domain rules)
    const users = [
      {
        name: 'Standard User',
        email: 'user@user.com',
        phone: '9000000001',
        password: 'user123', // pre-save hook will hash
        role: 'USER',
        username: 'user01',
        walletBalance: 150,
        isVerified: true
      },
      {
        name: 'Manager Account',
        email: 'manager@manager.com',
        phone: '9000000002',
        password: 'manager123',
        role: 'MANAGER',
        username: 'manager01',
        walletBalance: 0,
        isVerified: true
      },
      {
        name: 'Admin Account',
        email: 'admin@admin.com',
        phone: '9000000003',
        password: 'admin123',
        role: 'ADMIN',
        username: 'admin01',
        walletBalance: 0,
        isVerified: true
      }
    ];

    // Create users individually to trigger pre-save hooks
    const createdUsers = [];
    for (const userData of users) {
      // Hash password before saving
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
    }
    console.log(`👥 Created ${createdUsers.length} users`);

    // Create stations (coordinates for a typical college campus)
    const stations = [
      {
        name: 'Glass Building',
        location: {
          type: 'Point',
          coordinates: [77.2167, 28.6667]
        },
        capacity: 20,
        availableCycles: 0,
        facilities: ['CHARGING_POINT', 'SECURITY_CAMERA', 'COVERED_PARKING']
      },
      {
        name: 'Boys Hostel',
        location: {
          type: 'Point',
          coordinates: [77.2180, 28.6680]
        },
        capacity: 25,
        availableCycles: 0,
        facilities: ['CHARGING_POINT', 'COVERED_PARKING']
      },
      {
        name: 'Canteen',
        location: {
          type: 'Point',
          coordinates: [77.2150, 28.6650]
        },
        capacity: 15,
        availableCycles: 0,
        facilities: ['SECURITY_CAMERA', 'COVERED_PARKING']
      },
      {
        name: 'Mess',
        location: {
          type: 'Point',
          coordinates: [77.2200, 28.6700]
        },
        capacity: 12,
        availableCycles: 0,
        facilities: ['REPAIR_STATION']
      },
      {
        name: 'Bus Parking',
        location: {
          type: 'Point',
          coordinates: [77.2140, 28.6640]
        },
        capacity: 18,
        availableCycles: 0,
        facilities: ['COVERED_PARKING']
      },
      {
        name: 'Main Gate',
        location: {
          type: 'Point',
          coordinates: [77.2170, 28.6670]
        },
        capacity: 22,
        availableCycles: 0,
        facilities: ['CHARGING_POINT', 'SECURITY_CAMERA']
      },
      {
        name: 'Ground',
        location: {
          type: 'Point',
          coordinates: [77.2190, 28.6690]
        },
        capacity: 16,
        availableCycles: 0,
        facilities: ['COVERED_PARKING']
      },
      {
        name: 'Tissue Culture',
        location: {
          type: 'Point',
          coordinates: [77.2130, 28.6630]
        },
        capacity: 10,
        availableCycles: 0,
        facilities: ['CHARGING_POINT', 'SECURITY_CAMERA']
      }
    ];

    const createdStations = await Station.insertMany(stations);
    console.log(`🏢 Created ${createdStations.length} stations`);

    // Create cycles
    const cycleModels = ['Urban Rider', 'Campus Cruiser', 'Eco Cycle', 'Speed Demon'];
    const cycles = [];

    // Diverse bicycle images from Unsplash
    const imagePool = [
      'https://images.unsplash.com/photo-1518655048521-f130df041f66?q=80&w=1200&auto=format&fit=crop', // Red city bike
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=1200&auto=format&fit=crop', // Modern electric bike
      'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=1200&auto=format&fit=crop', // Blue vintage bike
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1200&auto=format&fit=crop', // Green mountain bike
      'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=1200&auto=format&fit=crop', // Orange road bike
      'https://images.unsplash.com/photo-1511994298241-608e28f14fde?q=80&w=1200&auto=format&fit=crop', // Yellow cruiser
      'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=1200&auto=format&fit=crop', // White bike
      'https://images.unsplash.com/photo-1559316973-14cfc0da8703?q=80&w=1200&auto=format&fit=crop', // Black bike
      'https://images.unsplash.com/photo-1571333250630-f0230c320b6d?q=80&w=1200&auto=format&fit=crop', // Electric scooter style
      'https://images.unsplash.com/photo-1556316384-12c35d30afa4?q=80&w=1200&auto=format&fit=crop'  // Hybrid bike
    ];

    for (let i = 1; i <= 30; i++) {
      const stationIndex = Math.floor(Math.random() * createdStations.length);
      const station = createdStations[stationIndex];
      const model = cycleModels[Math.floor(Math.random() * cycleModels.length)];
      const code = `CYC${String(i).padStart(3, '0')}`;
      const qrCode = `CYCLE_${code}_${Date.now()}_${i}`;
      
      // Add some variation to cycle locations (around the station)
      const latVariation = (Math.random() - 0.5) * 0.002; // ~200m variation
      const lngVariation = (Math.random() - 0.5) * 0.002;
      
      cycles.push({
        code,
        model,
        batteryLevel: Math.floor(Math.random() * 100) + 1,
        status: Math.random() > 0.2 ? 'AVAILABLE' : 'MAINTENANCE', // 80% available
        location: {
          type: 'Point',
          coordinates: [
            station.location.coordinates[0] + lngVariation,
            station.location.coordinates[1] + latVariation
          ]
        },
        station: station._id,
        qrCode,
        totalRides: Math.floor(Math.random() * 100),
        totalDistance: Math.floor(Math.random() * 500),
        imageUrl: imagePool[i % imagePool.length]
      });
    }

    const createdCycles = await Cycle.insertMany(cycles);
    console.log(`🚲 Created ${createdCycles.length} cycles`);

    // Update station available cycles count
    for (const station of createdStations) {
      const availableCycles = await Cycle.countDocuments({
        station: station._id,
        status: 'AVAILABLE'
      });
      
      await Station.findByIdAndUpdate(station._id, {
        availableCycles
      });
    }

    console.log('🎯 Updated station availability counts');

    console.log(`
🎉 Seed data created successfully!

Login credentials (match domain rules):
👤 User: user@user.com / user123
👨‍💼 Manager: manager@manager.com / manager123
👨‍💻 Admin: admin@admin.com / admin123

Stations: ${createdStations.length}
Cycles: ${createdCycles.length}
    `);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedData();
}

export { seedData };