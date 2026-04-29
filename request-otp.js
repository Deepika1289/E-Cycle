import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

async function requestOtp() {
  try {
    console.log('Requesting OTP for user@user.com...');
    
    const response = await axios.post(`${API_BASE_URL}/auth/request-login-otp`, {
      email: 'user@user.com'
    });
    
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

requestOtp();