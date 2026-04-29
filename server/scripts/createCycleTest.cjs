const axios = require('axios');

(async () => {
  try {
    const API = process.env.API_BASE || 'http://localhost:3000/api';
    // login as manager
    const login = await axios.post(`${API}/auth/login`, { username: 'manager01', password: 'manager123' });
    const token = login.data.token;
    console.log('Got token, length:', token.length);

    const payload = {
      code: `TEST${Date.now().toString().slice(-5)}`,
      model: 'Campus Cruiser',
      latitude: 28.6670,
      longitude: 77.2170,
      // stationId: '', // optional
      batteryLevel: 88,
      imageUrl: ''
    };

    const res = await axios.post(`${API}/cycles`, payload, { headers: { Authorization: `Bearer ${token}` } });
    console.log('status:', res.status);
    console.log('data:', res.data);
  } catch (err) {
    if (err.response) {
      console.error('status:', err.response.status);
      console.error('data:', err.response.data);
    } else {
      console.error('error:', err.message);
    }
    process.exit(1);
  }
})();
