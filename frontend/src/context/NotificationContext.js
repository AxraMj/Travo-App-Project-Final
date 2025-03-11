import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationsAPI } from '../services/api/notifications';
import { API_URL } from '../config/config';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      console.log('Fetching notifications count...');
      const response = await notificationsAPI.getNotifications();
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      console.log('Marking all notifications as read');
      await notificationsAPI.markAllAsRead();
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Mark a single notification as read
  const markAsRead = async (notificationId) => {
    try {
      console.log('Marking notification as read:', notificationId);
      await notificationsAPI.markAsRead(notificationId);
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchUnreadCount();

      // Set up WebSocket connection
      console.log('Setting up WebSocket connection...');
      const wsUrl = `ws://${API_URL.replace(/^https?:\/\//, '')}/ws?token=${token}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const { event: eventType, data } = JSON.parse(event.data);
          console.log('WebSocket message received:', eventType);
          
          if (eventType === 'notification') {
            console.log('New notification received');
            setUnreadCount(prev => prev + 1);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
        // Try to reconnect after 5 seconds
        setTimeout(() => {
          if (user && token) {
            console.log('Attempting to reconnect WebSocket...');
            ws.close();
            // The next useEffect run will establish a new connection
          }
        }, 5000);
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    }
  }, [user, token]);

  return (
    <NotificationContext.Provider value={{
      unreadCount,
      wsConnected,
      fetchUnreadCount,
      markAsRead,
      markAllAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
}; 