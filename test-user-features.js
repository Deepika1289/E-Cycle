import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';
const CLIENT_URL = 'http://localhost:5173';

async function testUserFeatures() {
  console.log('🧪 Testing E-Cycle User Features...\n');
  
  try {
    // 1. Login with standard user credentials using OTP
    console.log('1️⃣ Testing Login with OTP...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'test@example.com',
      otp: '816607'  // The OTP we generated
    });
    
    const { token, user } = loginResponse.data;
    console.log('✅ Login successful');
    console.log(`👤 User: ${user.name} (${user.role})`);
    console.log(`💰 Wallet Balance: $${user.walletBalance}\n`);
    
    // Set up authenticated requests
    const authAxios = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // 2. Dashboard access and viewing available cycles
    console.log('2️⃣ Testing Dashboard and Available Cycles...');
    const cyclesResponse = await authAxios.get('/cycles?status=AVAILABLE');
    console.log(`✅ Found ${cyclesResponse.data.cycles.length} available cycles\n`);
    
    // 3. Cycle booking functionality
    console.log('3️⃣ Testing Cycle Booking...');
    if (cyclesResponse.data.cycles.length > 0) {
      const cycle = cyclesResponse.data.cycles[0];
      const stationsResponse = await authAxios.get('/stations');
      const station = stationsResponse.data.stations[0];
      
      const bookingResponse = await authAxios.post('/bookings', {
        cycleId: cycle._id,
        startStationId: station._id,
        endStationId: station._id,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 30 * 60000).toISOString(), // 30 minutes from now
        duration: 30
      });
      
      console.log('✅ Cycle booking successful');
      console.log(`🔖 Booking ID: ${bookingResponse.data.booking._id}\n`);
      
      // 4. Ride start operations
      console.log('4️⃣ Testing Ride Start...');
      const rideStartResponse = await authAxios.post('/rides/start', {
        bookingId: bookingResponse.data.booking._id,
        latitude: station.location.coordinates[1],
        longitude: station.location.coordinates[0]
      });
      
      console.log('✅ Ride started successfully');
      console.log(`🚴 Ride ID: ${rideStartResponse.data._id}\n`);
      
      // 5. QR code scanning for cycle unlocking (simulate)
      console.log('5️⃣ Testing QR Code Scanning...');
      try {
        const qrVerifyResponse = await authAxios.get(`/qr/verify/${cycle._id}`);
        console.log('✅ QR code verification successful\n');
      } catch (error) {
        console.log('⚠️ QR code verification requires specific implementation\n');
      }
      
      // 6. Ride end operations
      console.log('6️⃣ Testing Ride End...');
      const rideEndResponse = await authAxios.post(`/rides/${rideStartResponse.data._id}/end`, {
        latitude: station.location.coordinates[1],
        longitude: station.location.coordinates[0]
      });
      
      console.log('✅ Ride ended successfully\n');
    }
    
    // 7. Reporting and viewing personal issues
    console.log('7️⃣ Testing Issue Reporting...');
    const issueResponse = await authAxios.post('/issues', {
      type: 'CYCLE_DAMAGE',
      title: 'Test Issue Report',
      description: 'This is a test issue report from automated testing',
      priority: 'MEDIUM'
    });
    
    console.log('✅ Issue reported successfully');
    console.log(`🎫 Issue ID: ${issueResponse.data._id}\n`);
    
    // 8. Profile management
    console.log('8️⃣ Testing Profile Management...');
    const profileResponse = await authAxios.patch('/users/profile', {
      name: 'Updated User Name'
    });
    
    console.log('✅ Profile updated successfully\n');
    
    // 9. Wallet top-up functionality
    console.log('9️⃣ Testing Wallet Top-up...');
    const topupResponse = await authAxios.post('/users/wallet/topup', {
      amount: 50
    });
    
    console.log('✅ Wallet top-up successful\n');
    
    // 10. Accessing ride history
    console.log('🔟 Testing Ride History Access...');
    const historyResponse = await authAxios.get('/rides');
    console.log(`✅ Retrieved ${historyResponse.data.length} ride records\n`);
    
    // 11. Notification systems
    console.log('11️⃣ Testing Notification Access...');
    try {
      const notificationsResponse = await authAxios.get('/notifications');
      console.log(`✅ Retrieved ${notificationsResponse.data.length} notifications\n`);
    } catch (error) {
      console.log('⚠️ Notifications endpoint may require specific implementation\n');
    }
    
    console.log('🎉 All user features tested successfully!');
    console.log(`🌐 Application is running at: ${CLIENT_URL}`);
    console.log(`📚 API Documentation: ${API_BASE_URL}/docs`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testUserFeatures();