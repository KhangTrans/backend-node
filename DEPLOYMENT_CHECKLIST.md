# Deployment Checklist

## ✅ Pre-deployment

- [x] Socket.IO installed: `npm install socket.io`
- [x] Prisma migrations created: `npx prisma migrate dev`
- [x] Environment variables configured in `.env`
- [x] Server tested locally: `node server.js`
- [x] Socket.IO tested locally
- [ ] Code committed to GitHub

## 📦 Railway Deployment

### Setup Railway
- [ ] Create Railway account (https://railway.app)
- [ ] Connect GitHub account
- [ ] Create new project from GitHub repo
- [ ] Generate public domain

### Environment Variables (Add in Railway)
Copy from `.env`:
- [ ] `DATABASE_URL`
- [ ] `JWT_SECRET`
- [ ] `JWT_EXPIRE`
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`
- [ ] `FRONTEND_URL`
- [ ] `REDIS_ENABLED`
- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`

### Deploy Settings
- [ ] Start command: `npm run deploy` (runs migrations + starts server)
- [ ] Build command: `npm install` (auto-detected)
- [ ] Node version: 18+ (auto-detected)

### Post-deployment
- [ ] Check deployment logs
- [ ] Visit Railway URL: `https://your-app.railway.app`
- [ ] Verify health: `https://your-app.railway.app/health`
- [ ] Test Socket.IO endpoint: `https://your-app.railway.app/socket.io/`

## 🌐 Frontend Configuration

### Update Frontend Config
```javascript
// config/api.js
export const API_CONFIG = {
  REST_URL: 'https://backend-node-lilac-seven.vercel.app',  // Vercel
  SOCKET_URL: 'https://your-app.railway.app'                // Railway
};
```

- [ ] Replace `your-app.railway.app` with actual Railway URL
- [ ] Install socket.io-client: `npm install socket.io-client`
- [ ] Update API calls to use `REST_URL` for normal requests
- [ ] Update Socket.IO connection to use `SOCKET_URL`
- [ ] Test notifications in production
- [ ] Test chat functionality

## 🧪 Testing

### Test REST API (Vercel)
- [ ] GET `https://backend-node-lilac-seven.vercel.app/api/products`
- [ ] POST `https://backend-node-lilac-seven.vercel.app/api/orders`
- [ ] GET `https://backend-node-lilac-seven.vercel.app/api/notifications`

### Test Socket.IO (Railway)
- [ ] Connect to Socket.IO from frontend
- [ ] Create test order → Check admin receives notification
- [ ] Admin updates order → Check user receives notification
- [ ] Send chat message → Check real-time delivery

## 🔍 Monitoring

- [ ] Check Railway logs for errors
- [ ] Monitor CPU/Memory usage in Railway dashboard
- [ ] Setup uptime monitoring (optional)
- [ ] Test from multiple devices/networks

## 🚨 Troubleshooting

If deployment fails:
1. Check Railway logs for error details
2. Verify all environment variables are set
3. Check database connection (Aiven might need IP whitelist update)
4. Run migrations manually: `railway run npx prisma migrate deploy`
5. Verify Socket.IO CORS settings allow frontend URL

## 📝 Notes

**Two Server Architecture:**
- **Vercel**: Handles REST API (fast, serverless, global CDN)
- **Railway**: Handles Socket.IO (persistent connections, WebSocket support)

**Why not all on Railway?**
- Vercel's edge network is faster for API requests
- Railway better for persistent connections (Socket.IO)
- Best of both worlds: Speed + Real-time

**Cost:**
- Vercel: Free (with limits)
- Railway: $5 credit/month free tier (~500 hours)
- Total: Effectively free for development/small projects

## ✨ After Successful Deployment

Your architecture:
```
Frontend (Vercel)
    ├── REST API → backend-node-lilac-seven.vercel.app
    └── Socket.IO → your-app.railway.app

Database: Aiven MySQL (shared)
Cache: Upstash Redis (shared)
```

Congratulations! You now have:
- ✅ Fast REST API on Vercel
- ✅ Real-time notifications on Railway
- ✅ Chat system with Socket.IO
- ✅ Full-stack production deployment
