import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'http://192.168.31.117:5000/api',  // Update this with your server IP
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  async (config) => {
    try {
      console.log('API - Request interceptor:', {
        url: config.url,
        method: config.method,
        baseURL: config.baseURL
      });
      
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('API - Token found and added to headers');
      } else {
        console.log('API - No token found in AsyncStorage');
      }
      
      console.log('API - Final request config:', {
        url: config.url,
        method: config.method,
        headers: config.headers
      });
      
      return config;
    } catch (error) {
      console.error('API - Request interceptor error:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('API - Request interceptor rejection:', error);
    return Promise.reject(error);
  }
);

export default api; 