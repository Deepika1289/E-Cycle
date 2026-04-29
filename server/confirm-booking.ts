import { Booking } from './src/models/Booking.js';
import { connectDB } from './src/config/database.js';
import mongoose from 'mongoose';

async function confirmBooking(bookingId) {
  try {
    // Connect to database
    await connectDB();
    
    // Update booking status to CONFIRMED
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: 'CONFIRMED' },
      { new: true }
    );
    
    if (booking) {
      console.log(`✅ Booking ${bookingId} confirmed successfully`);
    } else {
      console.log(`❌ Booking ${bookingId} not found`);
    }
    
    // Close connection
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Get booking ID from command line arguments
const bookingId = process.argv[2];
if (!bookingId) {
  console.log('Usage: node confirm-booking.js <bookingId>');
  process.exit(1);
}

confirmBooking(bookingId);