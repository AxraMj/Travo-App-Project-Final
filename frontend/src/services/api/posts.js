import api from './config';

export const postsAPI = {
  createPost: async (postData) => {
    try {
      const response = await api.post('/posts', postData);
      return response.data;
    } catch (error) {
      console.error('API Error - createPost:', error);
      throw error;
    }
  },

  getAllPosts: async () => {
    try {
      const response = await api.get('/posts');
      return response.data;
    } catch (error) {
      console.error('API Error - getAllPosts:', error);
      throw error;
    }
  },

  getUserPosts: async (userId) => {
    try {
      const response = await api.get(`/posts/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('API Error - getUserPosts:', error);
      throw error;
    }
  },

  likePost: async (postId) => {
    try {
      console.log('Sending like request for post:', postId);
      const response = await api.post(`/posts/${postId}/like`);
      console.log('Like response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API Error - likePost:', error.response?.data || error);
      throw error;
    }
  },

  savePost: async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/save`);
      return response.data;
    } catch (error) {
      console.error('API Error - savePost:', error);
      throw error;
    }
  },

  addComment: async (postId, commentData) => {
    try {
      console.log('API - Sending comment request:', {
        url: `/posts/${postId}/comment`,
        method: 'POST',
        data: commentData,
        headers: api.defaults.headers
      });
      const response = await api.post(`/posts/${postId}/comment`, commentData);
      console.log('API - Comment response:', {
        status: response.status,
        data: response.data,
        headers: response.headers
      });
      return response.data;
    } catch (error) {
      console.error('API Error - addComment:', {
        status: error.response?.status,
        data: error.response?.data,
        error: error.message,
        config: error.config,
        headers: error.response?.headers
      });
      throw error;
    }
  },

  deleteComment: async (postId, commentId) => {
    try {
      const response = await api.delete(`/posts/${postId}/comment/${commentId}`);
      return response.data;
    } catch (error) {
      console.error('API Error - deleteComment:', error);
      throw error;
    }
  },

  deletePost: async (postId) => {
    try {
      const response = await api.delete(`/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error('API Error - deletePost:', error);
      throw error;
    }
  },

  getFollowedPosts: async () => {
    try {
      const response = await api.get('/posts/following');
      return response.data;
    } catch (error) {
      console.error('API Error - getFollowedPosts:', error);
      throw error;
    }
  },

  getSavedPosts: async () => {
    try {
      const response = await api.get('/posts/saved');
      return response.data;
    } catch (error) {
      console.error('API Error - getSavedPosts:', error);
      throw error;
    }
  }
}; 