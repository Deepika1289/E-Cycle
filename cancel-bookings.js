import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

async function cancelActiveBookings() {
  console.log('Canceling active bookings for test user...\n');
  
  try {
    // Login with test user
    console.log('1️⃣ Logging in with test user...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'test@example.com',
      otp: '710032'  // The OTP we generated
    });
    
    const { token } = loginResponse.data;
    console.log('✅ Login successful\n');
    
    // Set up authenticated requests
    const authAxios = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Get all bookings
    console.log('2️⃣ Getting user bookings...');
    const bookingsResponse = await authAxios.get('/bookings');
    console.log(`✅ Found ${bookingsResponse.data.bookings.length} bookings\n`);
    
    // Cancel any active bookings
    for (const booking of bookingsResponse.data.bookings) {
      if (booking.status === 'PENDING' || booking.status === 'CONFIRMED') {
        console.log(`3️⃣ Canceling booking ${booking._id}...`);
        try {
          await authAxios.patch(`/bookings/${booking._id}/cancel`);
          console.log('✅ Booking canceled successfully\n');
        } catch (error) {
          console.log(`⚠️ Failed to cancel booking: ${error.response?.data?.message || error.message}\n`);
        }
      }
    }
    
    console.log('🎉 Active bookings cancellation completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

cancelActiveBookings();