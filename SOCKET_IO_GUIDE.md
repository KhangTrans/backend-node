# Socket.IO Real-time Notifications & Chat

## Tổng quan

Backend đã được tích hợp Socket.IO để hỗ trợ:
- **Real-time Notifications**: Thông báo cho admin khi có đơn hàng mới, thông báo cho user khi đơn hàng được cập nhật
- **Chat System**: Chat giữa user và admin (shop)

## Cài đặt Client

```bash
npm install socket.io-client
```

## Kết nối Socket.IO

### Frontend Connection

```javascript
import { io } from 'socket.io-client';

// Lấy token từ localStorage hoặc state management
const token = localStorage.getItem('token');

// Kết nối đến server
const socket = io('http://localhost:5000', {
  auth: {
    token: token // JWT token để xác thực
  },
  transports: ['websocket', 'polling']
});

// Listen to connection events
socket.on('connect', () => {
  console.log('✅ Connected to Socket.IO server');
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});
```

## Socket Events

### 1. Notifications

#### Listen for new notifications
```javascript
socket.on('new_notification', (notification) => {
  console.log('New notification:', notification);
  // notification = {
  //   id: 1,
  //   userId: 2,
  //   type: 'ORDER_CREATED',
  //   title: 'Đơn hàng mới',
  //   message: 'Đơn hàng ORD251226001 từ Nguyen Van A (1,500,000₫)',
  //   orderId: 5,
  //   isRead: false,
  //   createdAt: '2025-12-26T...'
  // }
  
  // Update UI: Show toast, update notification badge, etc.
});
```

#### Notification Types
- `ORDER_CREATED` - Đơn hàng mới (admin nhận)
- `ORDER_CONFIRMED` - Đơn hàng đã xác nhận (user nhận)
- `ORDER_SHIPPING` - Đơn hàng đang giao (user nhận)
- `ORDER_DELIVERED` - Đơn hàng đã giao (user nhận)
- `ORDER_CANCELLED` - Đơn hàng bị hủy
- `PAYMENT_CONFIRMED` - Thanh toán đã xác nhận (user nhận)
- `NEW_MESSAGE` - Tin nhắn mới
- `SYSTEM` - Thông báo hệ thống

#### Mark notification as read (via Socket)
```javascript
socket.emit('mark_notification_read', { notificationId: 1 });

socket.on('notification_marked_read', (data) => {
  console.log('Notification marked as read:', data.notificationId);
});
```

### 2. Chat Messages

#### Send message
```javascript
socket.emit('send_message', {
  receiverId: 1, // ID của người nhận (admin hoặc user)
  message: 'Xin chào, tôi muốn hỏi về sản phẩm...'
});

// Listen for confirmation
socket.on('message_sent', (message) => {
  console.log('Message sent successfully:', message);
  // message = {
  //   id: 10,
  //   senderId: 2,
  //   receiverId: 1,
  //   message: 'Xin chào...',
  //   isRead: false,
  //   createdAt: '2025-12-26T...',
  //   sender: { id: 2, username: 'user1', fullName: 'User One', role: 'user' },
  //   receiver: { id: 1, username: 'admin', fullName: 'Admin', role: 'admin' }
  // }
});
```

#### Listen for new messages
```javascript
socket.on('new_message', (message) => {
  console.log('New message received:', message);
  // Update chat UI, show notification, play sound, etc.
});
```

#### Mark messages as read
```javascript
socket.emit('mark_messages_read', { senderId: 1 });

socket.on('messages_marked_read', (data) => {
  console.log('Messages marked as read from:', data.senderId);
});
```

### 3. Typing Indicators (Optional)

```javascript
// User is typing
socket.emit('typing', { receiverId: 1 });

// User stopped typing
socket.emit('stop_typing', { receiverId: 1 });

// Listen for typing from other user
socket.on('user_typing', (data) => {
  console.log(`${data.username} is typing...`);
});

socket.on('user_stop_typing', (data) => {
  console.log(`User ${data.userId} stopped typing`);
});
```

### 4. Error Handling

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error.message);
  // Show error message to user
});
```

## REST API Endpoints

### Notifications

```http
# Get all notifications (with pagination)
GET /api/notifications?page=1&limit=20&isRead=false
Authorization: Bearer <token>

# Get unread count
GET /api/notifications/unread-count
Authorization: Bearer <token>

# Mark notification as read
PUT /api/notifications/:id/read
Authorization: Bearer <token>

# Mark all as read
PUT /api/notifications/read-all
Authorization: Bearer <token>

# Delete notification
DELETE /api/notifications/:id
Authorization: Bearer <token>

# Clear all read notifications
DELETE /api/notifications/clear-read
Authorization: Bearer <token>
```

### Messages

```http
# Get conversation with user
GET /api/messages/conversation/:userId?page=1&limit=50
Authorization: Bearer <token>

# Get all conversations
GET /api/messages/conversations
Authorization: Bearer <token>

# Send message (HTTP fallback)
POST /api/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "receiverId": 1,
  "message": "Hello..."
}

# Mark messages as read
PUT /api/messages/read/:senderId
Authorization: Bearer <token>

# Get unread message count
GET /api/messages/unread-count
Authorization: Bearer <token>

# Get users available for chat
GET /api/messages/users
Authorization: Bearer <token>
# Admin: returns all active users
# User: returns only admins
```

## Frontend Implementation Example (React)

### Socket Context Provider

```javascript
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children, token }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};
```

### Notification Component

```javascript
import { useEffect, useState } from 'react';
import { useSocket } from './SocketContext';

const NotificationBell = () => {
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Fetch initial unread count
    fetch('/api/notifications/unread-count', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUnreadCount(data.data.count));

    // Listen for new notifications
    if (socket) {
      socket.on('new_notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show toast notification
        toast.success(notification.title, {
          description: notification.message
        });
      });
    }

    return () => {
      socket?.off('new_notification');
    };
  }, [socket]);

  return (
    <div className="notification-bell">
      <Bell />
      {unreadCount > 0 && (
        <span className="badge">{unreadCount}</span>
      )}
    </div>
  );
};
```

### Chat Component

```javascript
import { useEffect, useState, useRef } from 'react';
import { useSocket } from './SocketContext';

const ChatWindow = ({ receiverId }) => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Fetch conversation history
    fetch(`/api/messages/conversation/${receiverId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setMessages(data.data));

    // Listen for new messages
    if (socket) {
      socket.on('new_message', (message) => {
        if (message.senderId === receiverId || message.receiverId === receiverId) {
          setMessages(prev => [...prev, message]);
          
          // Mark as read if chat is open
          socket.emit('mark_messages_read', { senderId: receiverId });
        }
      });

      socket.on('user_typing', (data) => {
        if (data.userId === receiverId) {
          setIsTyping(true);
        }
      });

      socket.on('user_stop_typing', (data) => {
        if (data.userId === receiverId) {
          setIsTyping(false);
        }
      });
    }

    return () => {
      socket?.off('new_message');
      socket?.off('user_typing');
      socket?.off('user_stop_typing');
    };
  }, [socket, receiverId]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    socket.emit('send_message', {
      receiverId,
      message: newMessage
    });

    setNewMessage('');
    socket.emit('stop_typing', { receiverId });
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    // Emit typing event
    socket.emit('typing', { receiverId });
    
    // Clear typing after 3 seconds of no typing
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      socket.emit('stop_typing', { receiverId });
    }, 3000);
  };

  return (
    <div className="chat-window">
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className={msg.senderId === userId ? 'sent' : 'received'}>
            <p>{msg.message}</p>
            <small>{new Date(msg.createdAt).toLocaleTimeString()}</small>
          </div>
        ))}
        {isTyping && <div className="typing-indicator">Đang nhập...</div>}
      </div>
      
      <div className="input-area">
        <input
          value={newMessage}
          onChange={handleTyping}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Nhập tin nhắn..."
        />
        <button onClick={sendMessage}>Gửi</button>
      </div>
    </div>
  );
};
```

## Workflow

### 1. Khi user tạo đơn hàng mới

```
User creates order → Backend creates order → Backend calls notifyAdmin()
→ Admin receives 'new_notification' event via Socket.IO
→ Admin sees notification "Đơn hàng mới: ORD251226001 (1,500,000₫)"
```

### 2. Khi admin xác nhận đơn hàng

```
Admin updates order status to 'confirmed' → Backend calls notifyUser()
→ User receives 'new_notification' event
→ User sees "Đơn hàng đã xác nhận và đang được xử lý"
```

### 3. Chat giữa user và admin

```
User sends message → Socket.IO emits 'send_message'
→ Backend saves message to database
→ Admin receives 'new_message' event
→ Admin sees message in real-time
→ Admin replies → User receives 'new_message'
```

## Production Deployment

### Vercel
Socket.IO không hoạt động trên Vercel serverless functions. Cần deploy Socket.IO server riêng trên:
- Railway
- Render
- DigitalOcean
- AWS EC2
- Heroku

### Environment Variables

```env
# Socket.IO CORS
FRONTEND_URL=https://your-frontend.vercel.app

# JWT Secret (for socket authentication)
JWT_SECRET=your_jwt_secret
```

## Testing

### Test với Postman/Thunder Client

1. **Get token**: Login để lấy JWT token
2. **Test REST endpoints**: Test các API notifications và messages
3. **Test Socket.IO**: Sử dụng [Socket.IO Client Tool](https://amritb.github.io/socketio-client-tool/) hoặc tạo HTML test file

### HTML Test File

```html
<!DOCTYPE html>
<html>
<head>
  <title>Socket.IO Test</title>
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
  <h1>Socket.IO Test</h1>
  <div id="status">Disconnected</div>
  <input id="token" placeholder="Enter JWT token" style="width: 400px">
  <button onclick="connect()">Connect</button>
  <div id="messages"></div>

  <script>
    let socket;
    
    function connect() {
      const token = document.getElementById('token').value;
      socket = io('http://localhost:5000', {
        auth: { token }
      });

      socket.on('connect', () => {
        document.getElementById('status').textContent = 'Connected';
        console.log('Connected');
      });

      socket.on('disconnect', () => {
        document.getElementById('status').textContent = 'Disconnected';
      });

      socket.on('new_notification', (data) => {
        console.log('Notification:', data);
        const div = document.createElement('div');
        div.textContent = `[${data.type}] ${data.title}: ${data.message}`;
        document.getElementById('messages').appendChild(div);
      });

      socket.on('new_message', (data) => {
        console.log('Message:', data);
        const div = document.createElement('div');
        div.textContent = `Message from ${data.sender.username}: ${data.message}`;
        document.getElementById('messages').appendChild(div);
      });
    }
  </script>
</body>
</html>
```

## Troubleshooting

### Socket không kết nối
- Kiểm tra JWT token có hợp lệ không
- Kiểm tra CORS configuration trong server.js
- Kiểm tra firewall/network

### Notification không nhận được
- Kiểm tra user có đang online (connected) không
- Kiểm tra console log trong backend
- Kiểm tra database có tạo notification không

### Message không gửi được
- Kiểm tra receiverId có tồn tại không
- Kiểm tra socket event listener có đúng không
- Kiểm tra database connection

## Summary

✅ Socket.IO đã được tích hợp hoàn chỉnh
✅ Real-time notifications khi có đơn hàng mới
✅ Real-time notifications khi admin cập nhật đơn hàng
✅ Chat system giữa user và admin
✅ API endpoints cho notifications và messages
✅ Authentication middleware cho Socket.IO
✅ Database models (Notification, Message)
