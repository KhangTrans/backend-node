# Frontend Integration Guide - Dual Server Setup

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│          Frontend (Vercel)                  │
│     https://frontend-ky7.vercel.app         │
└────────┬──────────────────────┬─────────────┘
         │                      │
         │ REST API             │ Socket.IO
         │ (HTTP)               │ (WebSocket)
         ▼                      ▼
┌─────────────────┐    ┌──────────────────────┐
│  Vercel Server  │    │  Railway Server      │
│  (Serverless)   │    │  (Persistent)        │
│                 │    │                      │
│  - Products     │    │  - Notifications     │
│  - Categories   │    │  - Chat              │
│  - Orders       │    │  - Real-time events  │
│  - Cart         │    │                      │
│  - Auth         │    │                      │
└─────────────────┘    └──────────────────────┘
```

## Step 1: Install Socket.IO Client

```bash
npm install socket.io-client
```

## Step 2: Create API Configuration

### Create `src/config/api.js`

```javascript
// src/config/api.js
const API_CONFIG = {
  // REST API - Vercel (cho normal HTTP requests)
  REST_URL: import.meta.env.VITE_REST_API_URL || 'https://backend-node-lilac-seven.vercel.app',
  
  // Socket.IO - Railway (cho WebSocket real-time)
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'https://your-app.railway.app'
};

export default API_CONFIG;
```

### Update `.env` (Frontend)

```env
# .env
VITE_REST_API_URL=https://backend-node-lilac-seven.vercel.app
VITE_SOCKET_URL=https://your-app.railway.app
```

## Step 3: Create API Service

### Create `src/services/api.service.js`

```javascript
// src/services/api.service.js
import API_CONFIG from '../config/api';

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.REST_URL;
  }

  // Helper to get auth headers
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (includeAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(options.auth !== false),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth
  async login(credentials) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      auth: false,
    });
  }

  async register(userData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      auth: false,
    });
  }

  // Products
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/products?${query}`, { auth: false });
  }

  async getProduct(id) {
    return this.request(`/api/products/${id}`, { auth: false });
  }

  // Categories
  async getCategories() {
    return this.request('/api/categories', { auth: false });
  }

  // Cart
  async getCart() {
    return this.request('/api/cart');
  }

  async addToCart(productId, quantity) {
    return this.request('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  }

  async updateCartItem(itemId, quantity) {
    return this.request(`/api/cart/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(itemId) {
    return this.request(`/api/cart/${itemId}`, {
      method: 'DELETE',
    });
  }

  // Orders
  async createOrder(orderData) {
    return this.request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/orders?${query}`);
  }

  async getOrder(id) {
    return this.request(`/api/orders/${id}`);
  }

  // Notifications (REST fallback)
  async getNotifications(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/notifications?${query}`);
  }

  async markNotificationAsRead(id) {
    return this.request(`/api/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/api/notifications/read-all', {
      method: 'PUT',
    });
  }

  async getUnreadNotificationCount() {
    return this.request('/api/notifications/unread-count');
  }

  // Messages (REST fallback)
  async getConversations() {
    return this.request('/api/messages/conversations');
  }

  async getConversation(userId) {
    return this.request(`/api/messages/conversation/${userId}`);
  }

  async sendMessage(receiverId, message) {
    return this.request('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ receiverId, message }),
    });
  }

  async markMessagesAsRead(senderId) {
    return this.request(`/api/messages/read/${senderId}`, {
      method: 'PUT',
    });
  }

  async getChatUsers() {
    return this.request('/api/messages/users');
  }
}

export default new ApiService();
```

## Step 4: Create Socket Service

### Create `src/services/socket.service.js`

```javascript
// src/services/socket.service.js
import { io } from 'socket.io-client';
import API_CONFIG from '../config/api';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    console.log('Connecting to Socket.IO server:', API_CONFIG.SOCKET_URL);

    this.socket = io(API_CONFIG.SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      console.log('Socket disconnected manually');
    }
  }

  // Event listeners
  on(event, callback) {
    if (!this.socket) {
      console.warn('Socket not connected');
      return;
    }

    this.socket.on(event, callback);
    
    // Store listener for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
      
      // Remove from stored listeners
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    } else {
      this.socket.off(event);
      this.listeners.delete(event);
    }
  }

  // Emit events
  emit(event, data) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot emit:', event);
      return;
    }

    this.socket.emit(event, data);
  }

  // Specific methods
  sendMessage(receiverId, message) {
    this.emit('send_message', { receiverId, message });
  }

  markMessagesAsRead(senderId) {
    this.emit('mark_messages_read', { senderId });
  }

  markNotificationAsRead(notificationId) {
    this.emit('mark_notification_read', { notificationId });
  }

  // Typing indicators
  typing(receiverId) {
    this.emit('typing', { receiverId });
  }

  stopTyping(receiverId) {
    this.emit('stop_typing', { receiverId });
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export default new SocketService();
```

## Step 5: Create React Hooks

### Create `src/hooks/useSocket.js`

```javascript
// src/hooks/useSocket.js
import { useEffect, useState } from 'react';
import socketService from '../services/socket.service';

export const useSocket = (token) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      socketService.disconnect();
      setIsConnected(false);
      return;
    }

    // Connect
    const socket = socketService.connect(token);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);

    // Check initial connection state
    setIsConnected(socket.connected);

    // Cleanup
    return () => {
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
    };
  }, [token]);

  return {
    socket: socketService.getSocket(),
    isConnected,
    sendMessage: socketService.sendMessage.bind(socketService),
    markMessagesAsRead: socketService.markMessagesAsRead.bind(socketService),
    typing: socketService.typing.bind(socketService),
    stopTyping: socketService.stopTyping.bind(socketService),
  };
};
```

### Create `src/hooks/useNotifications.js`

```javascript
// src/hooks/useNotifications.js
import { useEffect, useState } from 'react';
import { useSocket } from './useSocket';
import apiService from '../services/api.service';

export const useNotifications = (token) => {
  const { socket, isConnected } = useSocket(token);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch initial notifications
  useEffect(() => {
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const [notifData, countData] = await Promise.all([
          apiService.getNotifications({ limit: 20 }),
          apiService.getUnreadNotificationCount(),
        ]);

        setNotifications(notifData.data || []);
        setUnreadCount(countData.data?.count || 0);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [token]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewNotification = (notification) => {
      console.log('New notification received:', notification);
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Optional: Show toast notification
      // toast.success(notification.title, { description: notification.message });
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, isConnected]);

  const markAsRead = async (notificationId) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    isConnected,
  };
};
```

## Step 6: Example Components

### Notification Bell Component

```javascript
// src/components/NotificationBell.jsx
import { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { Bell } from 'lucide-react';

export const NotificationBell = () => {
  const token = localStorage.getItem('token');
  const { notifications, unreadCount, markAsRead, markAllAsRead, isConnected } =
    useNotifications(token);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
        {!isConnected && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-gray-400 rounded-full" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:underline"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Không có thông báo
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                  !notif.isRead ? 'bg-blue-50' : ''
                }`}
                onClick={() => markAsRead(notif.id)}
              >
                <h4 className="font-medium">{notif.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                <span className="text-xs text-gray-400 mt-2">
                  {new Date(notif.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
```

### Chat Component

```javascript
// src/components/ChatWindow.jsx
import { useEffect, useState, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import apiService from '../services/api.service';

export const ChatWindow = ({ receiverId, receiverName }) => {
  const token = localStorage.getItem('token');
  const { socket, isConnected, sendMessage } = useSocket(token);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch conversation history
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await apiService.getConversation(receiverId);
        setMessages(data.data || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [receiverId]);

  // Listen for new messages
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (message) => {
      if (
        message.senderId === receiverId ||
        message.receiverId === receiverId
      ) {
        setMessages((prev) => [...prev, message]);
        
        // Mark as read if chat is open
        if (message.senderId === receiverId) {
          apiService.markMessagesAsRead(receiverId);
        }
      }
    };

    const handleMessageSent = (message) => {
      // Message sent confirmation
      console.log('Message sent:', message);
    };

    const handleUserTyping = (data) => {
      if (data.userId === receiverId) {
        setIsTyping(true);
      }
    };

    const handleUserStopTyping = (data) => {
      if (data.userId === receiverId) {
        setIsTyping(false);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [socket, isConnected, receiverId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() || !isConnected) return;

    sendMessage(receiverId, newMessage);
    setNewMessage('');
    
    // Stop typing indicator
    socket.emit('stop_typing', { receiverId });
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!isConnected) return;

    // Emit typing event
    socket.emit('typing', { receiverId });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { receiverId });
    }, 3000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold">{receiverName}</h3>
        <span className="text-xs text-gray-500">
          {isConnected ? '🟢 Online' : '🔴 Offline'}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isSent = msg.senderId !== receiverId;
          return (
            <div
              key={msg.id}
              className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  isSent
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p>{msg.message}</p>
                <span className="text-xs opacity-75 mt-1 block">
                  {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-200 px-4 py-2 rounded-lg">
              <span className="text-gray-600 text-sm">Đang nhập...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Nhập tin nhắn..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!isConnected}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || !isConnected}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
};
```

## Summary

✅ **Dual Server Setup Complete**:
- Vercel handles REST API (fast, global)
- Railway handles Socket.IO (real-time)

✅ **Frontend Integration**:
- API service for REST calls
- Socket service for real-time
- React hooks for easy usage

✅ **Features**:
- Real-time notifications
- Chat with typing indicators
- Automatic reconnection
- Offline detection

## Next Steps

1. Deploy Railway server
2. Update `VITE_SOCKET_URL` in frontend `.env`
3. Deploy frontend to Vercel
4. Test real-time features in production
5. Monitor logs and performance

Happy coding! 🚀
