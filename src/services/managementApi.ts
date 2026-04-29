import axios from 'axios';

// Use Vite's import.meta.env for environment variables
const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:3000/api';

// Cycles Management API
export const cyclesApi = {
  getAll: async (params = {}) => {
    const response = await axios.get(`${API_URL}/cycles`, { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await axios.get(`${API_URL}/cycles/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await axios.post(`${API_URL}/cycles`, data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await axios.put(`${API_URL}/cycles/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await axios.delete(`${API_URL}/cycles/${id}`);
    return response.data;
  },
};

// Rides Tracking API
export const ridesApi = {
  getAll: async (params = {}) => {
    const response = await axios.get(`${API_URL}/rides`, { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await axios.get(`${API_URL}/rides/${id}`);
    return response.data;
  },
  
  updateStatus: async (id: string, status: string) => {
    const response = await axios.patch(`${API_URL}/rides/${id}/status`, { status });
    return response.data;
  },
};

// Stations Monitoring API
export const stationsApi = {
  getAll: async () => {
    const response = await axios.get(`${API_URL}/stations`);
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await axios.get(`${API_URL}/stations/${id}`);
    return response.data;
  },
  
  updateSettings: async (id: string, settings: any) => {
    const response = await axios.patch(`${API_URL}/stations/${id}/settings`, { settings });
    return response.data;
  },
};

// Issues Reporting API
export const issuesApi = {
  getAll: async () => {
    const response = await axios.get(`${API_URL}/issues`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await axios.post(`${API_URL}/issues`, data);
    return response.data;
  },
  
  updateStatus: async (id: string, status: string) => {
    const response = await axios.patch(`${API_URL}/issues/${id}/status`, { status });
    return response.data;
  },
};