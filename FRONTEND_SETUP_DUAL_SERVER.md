# Update Frontend - Kết nối 2 Servers

## 🏗️ Architecture

```
Frontend → REST API: https://backend-node-lilac-seven.vercel.app
         → Socket.IO: https://backend-node-5re9.onrender.com
```

---

## Bước 1: Install Socket.IO Client

```bash
npm install socket.io-client
```

---

## Bước 2: Tạo API Config

### File: `src/config/api.js`

```javascript
const API_CONFIG = {
  // REST API - Vercel (nhanh, cho GET/POST thông thường)
  REST_URL: 'https://backend-node-lilac-seven.vercel.app',
  
  // Socket.IO - Render (cho real-time notifications & chat)
  SOCKET_URL: 'https://backend-node-5re9.onrender.com'
};

export default API_CONFIG;
```

---

## Bước 3: Tạo API Service (REST)

### File: `src/services/api.js`

```javascript
import API_CONFIG from '../config/api';

const getHeaders = (token) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Auth
  login: async (credentials) => {
    const res = await fetch(`${API_CONFIG.REST_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return res.json();
  },

  // Products
  getProducts: async () => {
    const res = await fetch(`${API_CONFIG.REST_URL}/api/products`);
    return res.json();
  },

  // Orders
  createOrder: async (orderData, token) => {
    const res = await fetch(`${API_CONFIG.REST_URL}/api/orders`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(orderData)
    });
    return res.json();
  },

  // Notifications
  getNotifications: async (token) => {
    const res = await fetch(`${API_CONFIG.REST_URL}/api/notifications`, {
      headers: getHeaders(token)
    });
    return res.json();
  },

  getUnreadCount: async (token) => {
    const res = await fetch(`${API_CONFIG.REST_URL}/api/notifications/unread-count`, {
      headers: getHeaders(token)
    });
    return res.json();
  },

  markNotificationRead: async (id, token) => {
    const res = await fetch(`${API_CONFIG.REST_URL}/api/notifications/${id}/read`, {
      method: 'PUT',
      headers: getHeaders(token)
    });
    return res.json();
  },

  // Messages
  getConversations: async (token) => {
    const res = await fetch(`${API_CONFIG.REST_URL}/api/messages/conversations`, {
      headers: getHeaders(token)
    });
    return res.json();
  },

  getConversation: async (userId, token) => {
    const res = await fetch(`${API_CONFIG.REST_URL}/api/messages/conversation/${userId}`, {
      headers: getHeaders(token)
    });
    return res.json();
  }
};
```

---

## Bước 4: Tạo Socket Service (Real-time)

### File: `src/services/socket.js`

```javascript
import { io } from 'socket.io-client';
import API_CONFIG from '../config/api';

let socket = null;

export const socketService = {
  // Connect to Socket.IO server
  connect: (token) => {
    if (socket?.connected) return socket;

    socket = io(API_CONFIG.SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('✅ Socket.IO connected to Render');
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    return socket;
  },

  // Disconnect
  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  // Event listeners
  on: (event, callback) => {
    if (socket) socket.on(event, callback);
  },

  off: (event, callback) => {
    if (socket) socket.off(event, callback);
  },

  // Send message
  sendMessage: (receiverId, message) => {
    if (socket?.connected) {
      socket.emit('send_message', { receiverId, message });
    }
  },

  // Mark messages as read
  markMessagesRead: (senderId) => {
    if (socket?.connected) {
      socket.emit('mark_messages_read', { senderId });
    }
  },

  // Get socket instance
  getSocket: () => socket,

  isConnected: () => socket?.connected || false
};
```

---

## Bước 5: React Hook

### File: `src/hooks/useSocket.js`

```javascript
import { useEffect, useState } from 'react';
import { socketService } from '../services/socket';

export const useSocket = (token) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      socketService.disconnect();
      setIsConnected(false);
      return;
    }

    const socket = socketService.connect(token);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [token]);

  return {
    isConnected,
    socket: socketService.getSocket(),
    sendMessage: socketService.sendMessage,
    markMessagesRead: socketService.markMessagesRead
  };
};
```

---

## Bước 6: Component Example - Notifications

### File: `src/components/NotificationBell.jsx`

```javascript
import { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { api } from '../services/api';

export default function NotificationBell() {
  const token = localStorage.getItem('token');
  const { isConnected } = useSocket(token);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch initial data
  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const [notifData, countData] = await Promise.all([
          api.getNotifications(token),
          api.getUnreadCount(token)
        ]);
        setNotifications(notifData.data || []);
        setUnreadCount(countData.data?.count || 0);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchData();
  }, [token]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!isConnected) return;

    const handleNewNotification = (notification) => {
      console.log('📢 New notification:', notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification (optional)
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png'
        });
      }
    };

    socketService.on('new_notification', handleNewNotification);

    return () => {
      socketService.off('new_notification', handleNewNotification);
    };
  }, [isConnected]);

  const markAsRead = async (id) => {
    try {
      await api.markNotificationRead(id, token);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Connection indicator */}
      <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full"
            style={{ backgroundColor: isConnected ? '#10b981' : '#gray' }}
            title={isConnected ? 'Connected' : 'Disconnected'} />

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto z-50">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Thông báo</h3>
          </div>
          
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Không có thông báo
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                  !notif.isRead ? 'bg-blue-50' : ''
                }`}
                onClick={() => markAsRead(notif.id)}
              >
                <h4 className="font-medium">{notif.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                <span className="text-xs text-gray-400 mt-2 block">
                  {new Date(notif.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Bước 7: Component Example - Chat

### File: `src/components/Chat.jsx`

```javascript
import { useEffect, useState, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { api } from '../services/api';

export default function Chat({ receiverId, receiverName }) {
  const token = localStorage.getItem('token');
  const { isConnected, sendMessage } = useSocket(token);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch conversation history
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await api.getConversation(receiverId, token);
        setMessages(data.data || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [receiverId, token]);

  // Listen for new messages
  useEffect(() => {
    if (!isConnected) return;

    const handleNewMessage = (message) => {
      if (message.senderId === receiverId || message.receiverId === receiverId) {
        setMessages(prev => [...prev, message]);
      }
    };

    socketService.on('new_message', handleNewMessage);

    return () => {
      socketService.off('new_message', handleNewMessage);
    };
  }, [isConnected, receiverId]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() || !isConnected) return;
    
    sendMessage(receiverId, newMessage);
    setNewMessage('');
  };

  const currentUserId = JSON.parse(atob(token.split('.')[1])).id;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold">{receiverName}</h3>
        <span className="text-xs text-gray-500">
          {isConnected ? '🟢 Online' : '🔴 Offline'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => {
          const isSent = msg.senderId !== receiverId;
          return (
            <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2 rounded-lg ${
                isSent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
              }`}>
                <p>{msg.message}</p>
                <span className="text-xs opacity-75 mt-1 block">
                  {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
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
}
```

---

## Bước 8: Update Environment Variables

### File: `.env` (Frontend)

```env
VITE_REST_API_URL=https://backend-node-lilac-seven.vercel.app
VITE_SOCKET_URL=https://backend-node-5re9.onrender.com
```

Hoặc sử dụng hardcoded trong `api.js` như ở Bước 2.

---

## Bước 9: App.jsx Setup

### File: `src/App.jsx`

```javascript
import { useEffect } from 'react';
import { socketService } from './services/socket';
import NotificationBell from './components/NotificationBell';

function App() {
  const token = localStorage.getItem('token');

  // Auto-connect socket when user is logged in
  useEffect(() => {
    if (token) {
      socketService.connect(token);
      
      // Request notification permission
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    return () => {
      socketService.disconnect();
    };
  }, [token]);

  return (
    <div>
      {/* Your app content */}
      {token && <NotificationBell />}
    </div>
  );
}

export default App;
```

---

## ✅ Hoàn thành!

### Architecture hoạt động:

```
Frontend
  ├── REST API calls → Vercel (https://backend-node-lilac-seven.vercel.app)
  │   ├── Login/Register
  │   ├── Get products, categories
  │   ├── Create orders
  │   └── Get notifications history
  │
  └── Socket.IO → Render (https://backend-node-5re9.onrender.com)
      ├── Real-time notifications
      ├── Chat messages
      └── Typing indicators
```

### Test:

1. **Login** → Socket.IO tự động connect
2. **User tạo order** → Admin nhận notification real-time
3. **Admin update order** → User nhận notification
4. **Chat** → Messages sent/received instantly

### Deploy:

```bash
# Build frontend
npm run build

# Deploy to Vercel
vercel --prod
```

🎉 Done! Frontend giờ đã kết nối với cả 2 servers!
