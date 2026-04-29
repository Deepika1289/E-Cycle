import { MongoClient, ObjectId } from 'mongodb';

async function confirmBooking(bookingId) {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('cycles');
    const collection = db.collection('bookings');
    
    // Update booking status to CONFIRMED
    const result = await collection.updateOne(
      { _id: new ObjectId(bookingId) },
      { $set: { status: 'CONFIRMED' } }
    );
    
    if (result.matchedCount > 0) {
      console.log(`✅ Booking ${bookingId} confirmed successfully`);
    } else {
      console.log(`❌ Booking ${bookingId} not found`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

// Booking ID from our test
const bookingId = '691b00d2898023f34ac440a7';
confirmBooking(bookingId);