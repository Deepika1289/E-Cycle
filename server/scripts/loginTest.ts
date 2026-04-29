import axios from 'axios';

const API = process.env.API_BASE || 'http://localhost:3000/api';
const username = process.argv[2] || process.env.TEST_USERNAME || 'user01';
const password = process.argv[3] || process.env.TEST_PASSWORD || 'user123';

(async () => {
  try {
    const res = await axios.post(`${API}/auth/login`, { username, password }, { timeout: 5000 });
    console.log('status:', res.status);
    console.log('data:', res.data);
  } catch (err: any) {
    if (err.response) {
      console.error('status:', err.response.status);
      console.error('data:', err.response.data);
    } else {
      console.error('error:', err.message);
    }
    process.exit(1);
  }
})();
