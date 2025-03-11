import api from './config';

export const searchAPI = {
  searchAll: async (query) => {
    try {
      const response = await api.get(`/search?query=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('API Error - searchAll:', error);
      throw error;
    }
  },

  searchUsers: async (query) => {
    try {
      const response = await api.get(`/search/users?query=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('API Error - searchUsers:', error);
      throw error;
    }
  },

  searchLocations: async (query) => {
    try {
      const response = await api.get(`/search/locations?query=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('API Error - searchLocations:', error);
      throw error;
    }
  }
}; 