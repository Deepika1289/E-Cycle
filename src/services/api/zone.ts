import api from '../api';

export const zoneAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/zones', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching zones:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await api.get(`/zones/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching zone ${id}:`, error);
      throw error;
    }
  },

  create: async (zoneData: any) => {
    try {
      const response = await api.post('/zones', zoneData);
      return response.data;
    } catch (error) {
      console.error('Error creating zone:', error);
      throw error;
    }
  },

  update: async (id: string, zoneData: any) => {
    try {
      const response = await api.put(`/zones/${id}`, zoneData);
      return response.data;
    } catch (error) {
      console.error(`Error updating zone ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await api.delete(`/zones/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting zone ${id}:`, error);
      throw error;
    }
  },

  getCycles: async (id: string) => {
    try {
      const response = await api.get(`/zones/${id}/cycles`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching cycles for zone ${id}:`, error);
      throw error;
    }
  },

  assignCycles: async (id: string, data: { cycleIds: string[] }) => {
    try {
      const response = await api.post(`/zones/${id}/cycles`, data);
      return response.data;
    } catch (error) {
      console.error(`Error assigning cycles to zone ${id}:`, error);
      throw error;
    }
  },

  removeCycles: async (id: string, data: { cycleIds: string[] }) => {
    try {
      const response = await api.delete(`/zones/${id}/cycles`, { data });
      return response.data;
    } catch (error) {
      console.error(`Error removing cycles from zone ${id}:`, error);
      throw error;
    }
  }
};