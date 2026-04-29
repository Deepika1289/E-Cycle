import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

async function verifyTestUser() {
  try {
    console.log('Verifying test user...\n');
    
    // Use the OTP from the server logs
    const verificationData = {
      email: 'test@example.com',
      otp: '264700' // This is the OTP from the server logs
    };
    
    // Verify the OTP
    console.log('Verifying OTP...');
    const verifyResponse = await axios.post(`${API_BASE_URL}/auth/verify-otp`, verificationData);
    
    console.log('Verify Response:', verifyResponse.data);
    
    if (verifyResponse.data.token) {
      console.log('\n✅ User verified successfully!');
      console.log('Token:', verifyResponse.data.token);
    }
    
  } catch (error) {
    console.error('\n❌ User verification failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the verification
verifyTestUser();