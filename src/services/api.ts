import axios from 'axios';

// Use Vite's import.meta.env for environment variables
const API_BASE_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:3000/api';
const AI_SERVICE_URL = import.meta.env.VITE_APP_AI_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create AI service axios instance
const aiApi = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Create a custom event for auth expiration
const createAuthExpiredEvent = () => new CustomEvent('authExpired');

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    console.log('API Interceptor - Response received:', response.config.url, response.status);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.log('API Interceptor - Error status:', error.response?.status);
    console.log('API Interceptor - Original request URL:', originalRequest?.url);
    console.log('API Interceptor - Original request method:', originalRequest?.method);
    
    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('API Interceptor - 401 error detected, attempting token refresh');
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        console.log('API Interceptor - Refresh token found:', !!refreshToken);
        if (refreshToken) {
          console.log('API Interceptor - Attempting to refresh token');
          const response = await api.post('/auth/refresh', { refreshToken });
          const { token: newToken } = response.data;
          
          console.log('API Interceptor - Token refreshed successfully');
          localStorage.setItem('token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          return api(originalRequest);
        } else {
          console.log('API Interceptor - No refresh token found, emitting authExpired event');
        }
      } catch (refreshError) {
        // If refresh fails, remove tokens and emit auth expired event
        console.log('API Interceptor - Token refresh failed, emitting authExpired event');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        // Emit event for AuthContext to handle
        if (typeof window !== 'undefined') {
          window.dispatchEvent(createAuthExpiredEvent());
        }
        console.log('Token refresh failed, auth expired');
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (data: { email?: string; username?: string; otp: string }) => api.post('/auth/login', data),
  loginWithPassword: (username: string, password: string) => api.post('/auth/login', { username, password }),
  register: (userData: { name: string; email: string; password: string; phone: string; }) => 
    api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  verifyEmail: (token: string) => api.get(`/auth/verify-email/${token}`),
  refreshToken: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  getCurrentUser: () => api.get('/auth/me'),
  
  // OTP APIs
  requestRegistrationOtp: (data: { email: string }) => api.post('/auth/request-registration-otp', data),
  requestLoginOtp: (data: { email: string; username?: string } | { username: string; email?: string }) => api.post('/auth/request-login-otp', data),
  sendOtp: (data: { email: string }) => api.post('/auth/send-otp', data),
  verifyOtp: (data: { email: string; otp: string }) => api.post('/auth/verify-otp', data),
};

// Station APIs
export const stationAPI = {
  getAll: (params?: { lat?: number; lng?: number; radius?: number }) =>
    api.get('/stations', { params }),
  
  getNear: (params: { lat: number; lng: number; maxKm?: number }) =>
    api.get('/stations/near', { params }),
  
  getById: (id: string) => api.get(`/stations/${id}`),
  
  create: (data: {
    name: string;
    latitude: number;
    longitude: number;
    capacity: number;
    facilities?: string[];
  }) => api.post('/stations', data),
  
  update: (id: string, data: {
    name?: string;
    latitude?: number;
    longitude?: number;
    capacity?: number;
    facilities?: string[];
  }) => api.put(`/stations/${id}`, data),
  
  delete: (id: string) => api.delete(`/stations/${id}`),
};

// Cycle APIs
export const cycleAPI = {
  getAll: (params?: {
    lat?: number;
    lng?: number;
    radius?: number;
    status?: string;
    stationId?: string;
  }) => {
    // If lat/lng provided, use nearby endpoint
    if (params?.lat !== undefined && params?.lng !== undefined) {
      return api.get('/cycles/nearby', { params });
    }
    // Otherwise use regular cycles endpoint
    return api.get('/cycles', { params });
  },
  
  getById: (id: string) => api.get(`/cycles/${id}`),
  
  create: (data: {
    code: string;
    model: string;
    latitude: number;
    longitude: number;
    stationId?: string;
    batteryLevel?: number;
    imageUrl?: string;
  }) => api.post('/cycles', data),
  
  update: (id: string, data: {
    code?: string;
    model?: string;
    latitude?: number;
    longitude?: number;
    stationId?: string;
    batteryLevel?: number;
    imageUrl?: string;
    status?: string;
  }) => api.put(`/cycles/${id}`, data),
  
  updateStatus: (id: string, status: string) =>
    api.patch(`/cycles/${id}/status`, { status }),
  
  delete: (id: string) => api.delete(`/cycles/${id}`),
  
  // Nearby cycles
  getNearby: (params: { lat: number; lng: number; radius?: number }) =>
    api.get('/cycles/nearby', { params }),
};

// Booking APIs
export const bookingAPI = {
  getAll: (params?: { status?: string; limit?: number; page?: number }) =>
    api.get('/bookings', { params }),
  
  getById: (id: string) => api.get(`/bookings/${id}`),
  
  create: (data: { cycleId: string; startStationId: string; endStationId: string; startTime: string; endTime: string; duration: number; }) =>
    api.post('/bookings', data),
  
  cancel: (id: string) => api.patch(`/bookings/${id}/cancel`),
};

// Ride APIs
export const rideAPI = {
  getAll: (params?: { status?: string; limit?: number; page?: number }) =>
    api.get('/rides', { params }),
  
  getById: (id: string) => api.get(`/rides/${id}`),
  
  start: (data: { bookingId: string; latitude: number; longitude: number; }) => {
    console.log('rideAPI.start - Making request with data:', data);
    return api.post('/rides/start', data);
  },
  
  updateLocation: (id: string, data: { latitude: number; longitude: number; }) => api.post(`/rides/${id}/location`, data),
  
  end: (id: string, data: { latitude: number; longitude: number; }) => api.post(`/rides/${id}/end`, data),

  cancel: (id: string, data: { reason: string }) => api.post(`/rides/${id}/cancel`, data),
  
  scheduleEnd: (data: { rideId: string; endTime: string }) => api.post('/rides/schedule-end', data),
};

// Payment APIs
export const paymentAPI = {
  getAll: (params?: { status?: string; type?: string; limit?: number; page?: number; }) => api.get('/payments', { params }),
  
  getById: (id: string) => api.get(`/payments/${id}`),
  
  create: (data: { type: 'RIDE' | 'WALLET_TOPUP' | 'REFUND'; method: 'CARD' | 'UPI' | 'WALLET'; amount: number; bookingId?: string; }) => api.post('/payments', data),
  
  confirm: (id: string) => api.post(`/payments/${id}/confirm`),
  
  createIntent: (data: { amount: number; currency?: string; bookingId?: string; }) => api.post('/payments/create-intent', data),
};

// QR APIs
export const qrAPI = {
  unlock: (qrCode: string) => api.post('/qr/unlock', { qrCode }),
  verify: (cycleId: string) => api.get(`/qr/verify/${cycleId}`),
  confirmUnlock: (token: string) => api.post('/qr/confirm-unlock', { token }),
};

// Analytics APIs
export const analyticsAPI = {
  heatmap: (params?: { days?: number }) => api.get('/analytics/heatmap', { params }),
  usage: (params?: { days?: number }) => api.get('/analytics/usage', { params }),
};

// Issue APIs
export const issueAPI = {
  getAll: (params?: { status?: string; type?: string; priority?: string; limit?: number; page?: number; }) => api.get('/issues', { params }),
  
  getById: (id: string) => api.get(`/issues/${id}`),
  
  create: (data: { type: string; title: string; description: string; cycleId?: string; stationId?: string; priority?: string; }) => api.post('/issues', data),
  
  assign: (id: string, assignedTo?: string) => api.patch(`/issues/${id}/assign`, { assignedTo }),
  
  resolve: (id: string, resolution: string) => api.patch(`/issues/${id}/resolve`, { resolution }),
};

// AI APIs
export const aiAPI = {
  getRecommendations: (data: { latitude: number; longitude: number; preferences?: { batteryLevel?: number; maxDistance?: number; }; }) => api.post('/ai/recommendations', data),
  
  getFAQAnswer: (query: string) => api.post('/ai/faq', { query }),
  
  getAllFAQs: () => api.get('/ai/faq/all'),
  
  // New AI service endpoints
  getDemandForecast: (data: { stations: Array<{ id: string; lat: number; lng: number; count?: number }>; history: Array<any> }) => 
    aiApi.post('/forecast', data),
  
  getOptimizationRecommendations: (data: any) => aiApi.post('/recommendations', data),
};

// User APIs
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  
  updateProfile: (data: any) => api.patch('/users/profile', data),
  
  topupWallet: (amount: number) => api.post('/users/wallet/topup', { amount }),
  
  getAll: (params?: { role?: string; limit?: number; page?: number }) =>
    api.get('/users', { params }),
  
  updateUser: (id: string, data: { name?: string; email?: string; phone?: string; role?: string; walletBalance?: number }) =>
    api.patch(`/users/${id}`, data),
  
  suspendUser: (id: string, status: 'ACTIVE' | 'SUSPENDED') =>
    api.patch(`/users/${id}/suspend`, { status }),
};

export default api;