# Deploy lên Railway (Cho Socket.IO Real-time)

## Tại sao cần Railway?
- ✅ **Socket.IO không chạy trên Vercel** (serverless không hỗ trợ WebSocket)
- ✅ Railway hỗ trợ WebSocket persistent connections
- ✅ Free tier: $5 credit/tháng (~500 giờ runtime)
- ✅ Auto deploy từ GitHub
- ✅ Database và Redis built-in

## Architecture: 2 Servers

### 🟦 Server 1: Vercel (REST API)
- **URL**: `https://backend-node-lilac-seven.vercel.app`
- **Chức năng**: REST API (products, categories, orders, cart, auth)
- **Ưu điểm**: Cực nhanh, serverless, edge network

### 🟥 Server 2: Railway (Socket.IO)
- **URL**: `https://your-app.railway.app`
- **Chức năng**: WebSocket real-time (notifications, chat)
- **Ưu điểm**: Persistent connections, full Node.js support

---

## Bước 1: Tạo tài khoản Railway

1. Truy cập https://railway.app
2. Click **"Login"** → **Sign in with GitHub**
3. Authorize Railway truy cập repos

## Bước 2: Deploy Project

1. Click **"New Project"**
2. Chọn **"Deploy from GitHub repo"**
3. Chọn repository Backend
4. Railway tự động detect và deploy

## Bước 3: Configure Environment Variables

Click vào service → **Variables** tab → Add all:

```env
# Database (dùng Aiven hiện tại - copy từ .env)
DATABASE_URL=mysql://avnadmin:YOUR_PASSWORD@mysql-30cab664-trank7866-3a4c.c.aivencloud.com:27426/defaultdb?ssl-mode=REQUIRED

# JWT
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=dsom4uuux
CLOUDINARY_API_KEY=456735213468847
CLOUDINARY_API_SECRET=1o0dN-j_hSDrj3AuyFd2Ce8uozI

# Frontend URL
FRONTEND_URL=https://frontend-ky7.vercel.app

# Redis (Upstash)
REDIS_ENABLED=true
UPSTASH_REDIS_REST_URL=https://exact-terrapin-53504.upstash.io
UPSTASH_REDIS_REST_TOKEN=AdEAAAIncDFiNzEyN2M2MjU2ZDM0NDU2OWNkMThiOGQyZGQ3MTU3N3AxNTM1MDQ

# Railway tự động set PORT, không cần add
```

## Bước 4: Generate Public URL

1. Click service → **Settings** tab
2. Scroll xuống **Networking** section
3. Click **"Generate Domain"**
4. Nhận được URL: `backend-production-xxxx.up.railway.app`

## Bước 5: Run Database Migrations

Railway có thể chưa chạy migrations. Update `package.json`:

```json
{
  "scripts": {
    "start": "node server.js",
    "build": "npx prisma generate",
    "deploy": "npx prisma migrate deploy && node server.js"
  }
}
```

Trong Railway **Settings** → **Deploy** → **Start Command**:
```
npm run deploy
```

Hoặc chạy manual qua Railway shell:
- Click **"Shell"** icon
- Run: `npx prisma migrate deploy`

## Bước 6: Verify Deployment

Truy cập: `https://your-app.railway.app`

Expected response:
```json
{
  "message": "Welcome to Backend API",
  "status": "running",
  "environment": "production"
}
```

Check Socket.IO: `https://your-app.railway.app/socket.io/` → Should return "Missing error handler"

---

---

## Frontend Configuration (Dual Server Setup)

### Install Socket.IO Client

```bash
npm install socket.io-client
```

### Create API Config

```javascript
// src/config/api.js
export const API_CONFIG = {
  // REST API - Vercel (fast, serverless)
  REST_URL: 'https://backend-node-lilac-seven.vercel.app',
  
  // Socket.IO - Railway (WebSocket support)
  SOCKET_URL: 'https://your-app.railway.app' // Replace với Railway URL
};
```

### API Service (REST)

```javascript
// src/services/api.js
import { API_CONFIG } from '../config/api';

// Sử dụng Vercel cho REST API
export const api = {
  // Products
  getProducts: () => fetch(`${API_CONFIG.REST_URL}/api/products`).then(r => r.json()),
  
  // Orders
  createOrder: (data, token) => 
    fetch(`${API_CONFIG.REST_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  // Notifications (REST fallback)
  getNotifications: (token) =>
    fetch(`${API_CONFIG.REST_URL}/api/notifications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()),
    
  // Messages (REST fallback)  
  getConversations: (token) =>
    fetch(`${API_CONFIG.REST_URL}/api/messages/conversations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json())
};
```

### Socket Service (Real-time)

```javascript
// src/services/socket.js
import { io } from 'socket.io-client';
import { API_CONFIG } from '../config/api';

let socket = null;

export const socketService = {
  connect: (token) => {
    if (socket?.connected) return socket;
    
    socket = io(API_CONFIG.SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    
    socket.on('connect', () => {
      console.log('✅ Socket connected to Railway');
    });
    
    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });
    
    return socket;
  },
  
  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },
  
  getSocket: () => socket
};
```

### React Hook Example

```javascript
// src/hooks/useSocket.js
import { useEffect, useState } from 'react';
import { socketService } from '../services/socket';

export const useSocket = (token) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const sock = socketService.connect(token);
    setSocket(sock);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    sock.on('connect', onConnect);
    sock.on('disconnect', onDisconnect);

    return () => {
      sock.off('connect', onConnect);
      sock.off('disconnect', onDisconnect);
    };
  }, [token]);

  return { socket, isConnected };
};
```

### Usage in Component

```javascript
// src/components/Dashboard.jsx
import { useSocket } from '../hooks/useSocket';
import { api } from '../services/api';
import { useEffect, useState } from 'react';

function Dashboard() {
  const token = localStorage.getItem('token');
  const { socket, isConnected } = useSocket(token);
  const [notifications, setNotifications] = useState([]);

  // Fetch notifications từ REST API (Vercel)
  useEffect(() => {
    api.getNotifications(token).then(data => {
      setNotifications(data.data);
    });
  }, []);

  // Listen real-time notifications từ Socket.IO (Railway)
  useEffect(() => {
    if (!socket) return;

    socket.on('new_notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      // Show toast
      toast.success(notification.title, {
        description: notification.message
      });
    });

    return () => {
      socket.off('new_notification');
    };
  }, [socket]);

  return (
    <div>
      <h1>Dashboard</h1>
      {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      {/* Your UI */}
    </div>
  );
}
```

---

## Monitoring & Logs

### Railway Dashboard
- Real-time logs: Click service → **Logs** tab
- Metrics: CPU, Memory, Network usage
- Deployments history

### Check Logs
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# View logs
railway logs
```

---

## Pricing

### Railway Free Tier
- **$5 credit/month** (renews monthly)
- ~500 hours runtime
- Good for: Development, small projects

### When free tier ends
- **Hobby Plan**: $5/month
- **Pro Plan**: $20/month (better resources)

### Cost optimization
- Railway auto-sleeps after 24h inactivity (free tier)
- Pro plan: Always running

---

## Troubleshooting

### Build Failed
**Error**: Missing dependencies
```bash
# Fix: Ensure package.json has all deps
npm install socket.io @upstash/redis
git add package.json package-lock.json
git commit -m "Add socket.io dependencies"
git push
```

### Database Connection Error
**Error**: Can't connect to MySQL

**Fix**: Aiven IP whitelist
1. Railway IPs change dynamically
2. Trong Aiven dashboard → **Allowed IP Addresses**
3. Add: `0.0.0.0/0` (allow all) - ⚠️ Not recommended for production
4. Better: Use Aiven's public endpoint

### Socket.IO Not Working
**Check**:
1. Frontend connecting to Railway URL (not Vercel)
2. CORS allows your frontend URL
3. Railway logs for connection attempts

### Migration Failed
```bash
# Connect to Railway shell
railway run npx prisma db push

# Or use migrate deploy
railway run npx prisma migrate deploy
```

---

## Summary: Dual Server Setup

✅ **Vercel** → REST API (fast, global CDN)
✅ **Railway** → Socket.IO (WebSocket support)
✅ **Frontend** → Calls Vercel for data, Railway for real-time
✅ **Best of both worlds**: Speed + Real-time features

## Next Steps

1. Deploy lên Railway theo các bước trên
2. Copy Railway URL
3. Update frontend config với Railway URL
4. Test Socket.IO connection
5. Enjoy real-time notifications! 🎉

3. Connect GitHub repo
4. Thêm environment variables
5. Deploy!

---

**Lưu ý:** Cả Railway và Render đều hỗ trợ MySQL + Sequelize tốt hơn Vercel serverless!

Bạn muốn thử platform nào? 🚀
