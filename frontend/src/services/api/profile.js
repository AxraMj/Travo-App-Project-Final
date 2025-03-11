import api from './config';

export const profileAPI = {
  getProfile: async (userId) => {
    try {
      const response = await api.get(`/profiles/${userId}`);
      return response.data;
    } catch (error) {
      console.error('API Error - getProfile:', error);
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/profiles/update', profileData);
      return response.data;
    } catch (error) {
      console.error('API Error - updateProfile:', error);
      throw error;
    }
  },

  updateStats: async (stats) => {
    try {
      const response = await api.put('/profiles/stats', { stats });
      return response.data;
    } catch (error) {
      console.error('API Error - updateStats:', error);
      throw error;
    }
  },

  followUser: async (userId) => {
    try {
      const response = await api.post(`/profiles/${userId}/follow`);
      return response.data;
    } catch (error) {
      console.error('API Error - followUser:', error);
      throw error;
    }
  },

  unfollowUser: async (userId) => {
    try {
      const response = await api.post(`/profiles/${userId}/unfollow`);
      return response.data;
    } catch (error) {
      console.error('API Error - unfollowUser:', error);
      throw error;
    }
  },

  getFollowers: async (userId) => {
    try {
      const response = await api.get(`/profiles/${userId}/followers`);
      return response.data;
    } catch (error) {
      console.error('Error fetching followers:', error);
      throw error;
    }
  },

  getFollowing: async (userId) => {
    try {
      const response = await api.get(`/profiles/${userId}/following`);
      return response.data;
    } catch (error) {
      console.error('Error fetching following:', error);
      throw error;
    }
  }
}; 