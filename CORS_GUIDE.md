# 🔒 CORS Configuration Guide

## ✅ Đã cấu hình CORS

CORS (Cross-Origin Resource Sharing) đã được cấu hình trong [server.js](./server.js) để cho phép frontend từ các domain khác nhau có thể gọi API.

## 📋 Cấu hình hiện tại

```javascript
const corsOptions = {
  origin: [
    'http://localhost:5173',      // Vite default
    'http://localhost:5174',      // Vite alternate
    'http://localhost:3000',      // React/Next.js default
    'https://your-frontend-domain.vercel.app',
    process.env.FRONTEND_URL      // From .env
  ],
  credentials: true,              // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400                   // 24 hours cache
};
```

## 🔧 Thêm Domain Frontend

### 1. Local Development
Các domain local đã được thêm sẵn:
- `http://localhost:5173` - Vite
- `http://localhost:5174` - Vite (port khác)
- `http://localhost:3000` - React/Next.js

### 2. Production (Vercel)

#### Cách 1: Thêm trực tiếp vào code
Sửa file [server.js](./server.js):
```javascript
origin: [
  // ... existing origins
  'https://my-frontend.vercel.app',
  'https://www.mydomain.com'
]
```

#### Cách 2: Dùng Environment Variable (Khuyến nghị)
1. Thêm vào file `.env`:
```env
FRONTEND_URL=https://my-frontend.vercel.app
```

2. Hoặc thêm trên Vercel Dashboard:
   - Vào **Settings** → **Environment Variables**
   - Add: `FRONTEND_URL = https://my-frontend.vercel.app`
   - Save và Redeploy

## 🧪 Test CORS

### Cách 1: Dùng HTML Test File
1. Mở file [test-cors.html](./test-cors.html) trong browser
2. Nhập API URL (local hoặc production)
3. Click các button để test các loại request

### Cách 2: Dùng cURL
```bash
# Test preflight
curl -X OPTIONS http://localhost:5000/api/products \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  -v

# Test GET request
curl http://localhost:5000/api/categories \
  -H "Origin: http://localhost:5173" \
  -v
```

### Cách 3: Dùng JavaScript (Console)
```javascript
// Test trong browser console
fetch('http://localhost:5000/api/categories', {
  credentials: 'include'
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('CORS Error:', err));
```

## 🔍 CORS Headers Response

Khi CORS hoạt động đúng, response sẽ có các headers:
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS,PATCH
Access-Control-Allow-Headers: Content-Type,Authorization,X-Requested-With
Access-Control-Max-Age: 86400
```

## ⚠️ Troubleshooting

### Lỗi: "CORS policy: No 'Access-Control-Allow-Origin' header"
**Nguyên nhân:** Origin của frontend không nằm trong danh sách cho phép

**Giải pháp:**
1. Kiểm tra origin đang dùng: `console.log(window.location.origin)`
2. Thêm origin đó vào `corsOptions.origin` trong [server.js](./server.js)
3. Hoặc set `FRONTEND_URL` trong `.env`

### Lỗi: "Credentials flag is 'true'"
**Nguyên nhân:** Backend config `credentials: true` nhưng frontend không gửi credentials

**Giải pháp:** Thêm `credentials: 'include'` trong fetch:
```javascript
fetch('http://localhost:5000/api/products', {
  credentials: 'include'
})
```

### Lỗi: "OPTIONS 404"
**Nguyên nhân:** Server không xử lý OPTIONS request

**Giải pháp:** Đã fix - CORS middleware tự động xử lý OPTIONS

## 📱 Frontend Configuration Examples

### Axios
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Usage
api.get('/api/categories').then(res => console.log(res.data));
```

### Fetch API
```javascript
const API_URL = 'http://localhost:5000';

async function getCategories() {
  const response = await fetch(`${API_URL}/api/categories`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}
```

### Next.js API Route
```javascript
// pages/api/proxy.js
export default async function handler(req, res) {
  const apiUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  
  const response = await fetch(`${apiUrl}${req.url}`, {
    method: req.method,
    headers: {
      ...req.headers,
      'Content-Type': 'application/json'
    },
    body: req.body ? JSON.stringify(req.body) : undefined
  });
  
  const data = await response.json();
  res.status(response.status).json(data);
}
```

## 🚀 Production Checklist

- [ ] Thêm production domain vào `corsOptions.origin`
- [ ] Set `FRONTEND_URL` environment variable trên Vercel
- [ ] Test CORS từ production frontend
- [ ] Kiểm tra credentials có hoạt động không
- [ ] Verify authentication với tokens

## 📚 Resources

- [MDN CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Express CORS Package](https://www.npmjs.com/package/cors)
- [Vercel CORS Guide](https://vercel.com/guides/how-to-enable-cors)
