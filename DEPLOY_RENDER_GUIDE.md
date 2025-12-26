# Deploy Backend lên Render.com - Hướng dẫn chi tiết

## Bước 1: Tạo tài khoản Render

1. Truy cập: https://dashboard.render.com
2. Click **"Sign Up"** hoặc **"Get Started"**
3. Chọn **"Sign in with GitHub"**
4. Authorize Render truy cập GitHub repos của bạn

## Bước 2: Deploy Web Service

### 2.1. Tạo New Web Service

1. Trong Render Dashboard, click **"Deploy a Web Service"** (hoặc nút **"New +"** → **"Web Service"**)
2. Render sẽ hiện list GitHub repos của bạn

### 2.2. Connect Repository

1. Tìm repository **Backend** của bạn (vd: `KhangTrans/backend-node`)
2. Click **"Connect"** bên phải repo

**Nếu không thấy repo:**
- Click **"Configure account"** để cấp quyền thêm repos
- Hoặc click **"+ Public Git repository"** và paste URL repo

### 2.3. Configure Service

Điền thông tin:

**Name**: `backend-socketio` (hoặc tên bạn muốn)

**Region**: 
- Chọn **Singapore** (gần Việt Nam nhất)
- Hoặc **Frankfurt** (Europe)

**Branch**: `main` hoặc `master`

**Root Directory**: Để trống (nếu code ở root)

**Runtime**: **Node**

**Build Command**: 
```
npm install
```

**Start Command**: 
```
npm run deploy
```

**Instance Type**: 
- Chọn **Free** ($0/month)
- 512MB RAM, Shared CPU

### 2.4. Advanced Settings

Scroll xuống, click **"Advanced"**

**Auto-Deploy**: 
- ✅ Bật "Auto-Deploy" (tự deploy khi push code lên GitHub)

## Bước 3: Add Environment Variables

Trong phần **Environment Variables**, click **"Add Environment Variable"**

Thêm từng cặp key-value sau:

### Database
```
Key: DATABASE_URL
Value: mysql://avnadmin:YOUR_PASSWORD@mysql-30cab664-trank7866-3a4c.c.aivencloud.com:27426/defaultdb?ssl-mode=REQUIRED
```

**⚠️ Important**: Thay `YOUR_PASSWORD` bằng password thật từ file `.env` của bạn

### JWT
```
Key: JWT_SECRET
Value: your_jwt_secret_key_change_this_in_production
```

```
Key: JWT_EXPIRE
Value: 7d
```

### Cloudinary
```
Key: CLOUDINARY_CLOUD_NAME
Value: dsom4uuux
```

```
Key: CLOUDINARY_API_KEY
Value: 456735213468847
```

```
Key: CLOUDINARY_API_SECRET
Value: 1o0dN-j_hSDrj3AuyFd2Ce8uozI
```

### Frontend
```
Key: FRONTEND_URL
Value: https://frontend-ky7.vercel.app
```

### Redis (Upstash)
```
Key: REDIS_ENABLED
Value: true
```

```
Key: UPSTASH_REDIS_REST_URL
Value: https://exact-terrapin-53504.upstash.io
```

```
Key: UPSTASH_REDIS_REST_TOKEN
Value: AdEAAAIncDFiNzEyN2M2MjU2ZDM0NDU2OWNkMThiOGQyZGQ3MTU3N3AxNTM1MDQ
```

**Tip**: Copy tất cả từ file `.env`, paste vào text editor, format thành key-value rồi add vào Render.

## Bước 4: Deploy

1. Sau khi điền xong environment variables
2. Click **"Create Web Service"** ở cuối trang
3. Render sẽ bắt đầu build và deploy

### Quá trình Deploy:

```
Building... → Installing dependencies → Building app → Starting server
```

Chờ khoảng 3-5 phút cho lần deploy đầu tiên.

## Bước 5: Kiểm tra Deploy

### 5.1. Check Logs

Trong dashboard service, tab **"Logs"** sẽ hiển thị:

```
==> Building...
npm install
...
==> Deploying...
npm run deploy
npx prisma migrate deploy
✅ Prisma migrations applied
🚀 Server is running on port 10000
✅ Upstash Redis connected successfully
🔌 Socket.IO initialized successfully
```

### 5.2. Test URL

Render sẽ cấp URL dạng: `https://backend-socketio.onrender.com`

**Test endpoints:**

1. Health check:
```
https://backend-socketio.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-26T...",
  "database": "configured"
}
```

2. Test API:
```
https://backend-socketio.onrender.com/api/products
```

3. Socket.IO:
```
https://backend-socketio.onrender.com/socket.io/
```

Should see: `{"code":0,"message":"Transport unknown"}`

## Bước 6: Fix Database Connection (Nếu lỗi)

Nếu thấy lỗi database connection trong logs:

### Option 1: Aiven IP Whitelist

1. Vào Aiven dashboard → Database
2. Tab **"Overview"** → **"Allowed IP Addresses"**
3. Add: `0.0.0.0/0` (allow all IPs)
4. Click **"Save changes"**

### Option 2: Check DATABASE_URL

Trong Render, vào **"Environment"** tab, verify `DATABASE_URL` format:
```
mysql://USER:PASSWORD@HOST:PORT/DATABASE?ssl-mode=REQUIRED
```

## Bước 7: Run Migrations (Nếu cần)

Nếu migrations chưa chạy trong start command:

### Via Render Shell

1. Trong service dashboard, click **"Shell"** (bên trái)
2. Chờ shell mở
3. Chạy:
```bash
npx prisma migrate deploy
```

### Via Manual Deploy

1. Tab **"Manual Deploy"** → **"Deploy latest commit"**
2. Render sẽ rebuild và chạy lại `npm run deploy` (đã có migrate)

## Bước 8: Update Frontend

Sau khi deploy thành công, copy Render URL.

### Update Frontend Config

```javascript
// src/config/api.js
export const API_CONFIG = {
  REST_URL: 'https://backend-node-lilac-seven.vercel.app',  // Vercel
  SOCKET_URL: 'https://backend-socketio.onrender.com'       // Render
};
```

### Environment Variables (.env frontend)

```env
VITE_REST_API_URL=https://backend-node-lilac-seven.vercel.app
VITE_SOCKET_URL=https://backend-socketio.onrender.com
```

Deploy frontend lại lên Vercel.

## Bước 9: Test Real-time Features

### Test Socket.IO Connection

Mở frontend → Inspect → Console, should see:
```
✅ Socket.IO connected
Connected to Socket.IO server
```

### Test Notifications

1. **User tạo order** → Admin nhận notification real-time
2. **Admin update order status** → User nhận notification

### Test Chat

1. User chat với admin
2. Messages delivered instantly

## Features Render FREE Tier

✅ **750 hours/month** (đủ chạy 24/7 cả tháng)
✅ **512MB RAM** (nhiều hơn Fly.io)
✅ **Auto-deploy** from GitHub
✅ **SSL certificate** tự động (HTTPS)
✅ **100GB bandwidth/month**

⚠️ **Lưu ý**: 
- Free tier sẽ **sleep sau 15 phút** không có request
- Request đầu tiên sau khi sleep mất ~30 giây để wake up

## Troubleshooting

### Build Failed

**Check logs** trong tab "Logs":

**Common issues:**
- Missing dependencies → Add to `package.json`
- Node version mismatch → Update `package.json` engines
- Prisma generate failed → Ensure `prisma generate` in build script

**Fix**: Update `package.json`:
```json
{
  "scripts": {
    "build": "prisma generate",
    "deploy": "prisma migrate deploy && node server.js"
  }
}
```

Redeploy: **Manual Deploy** → **Clear build cache & deploy**

### Database Connection Failed

**Symptoms**: `Can't reach database server`

**Fix**:
1. Check DATABASE_URL format
2. Aiven: Allow all IPs (0.0.0.0/0)
3. Test connection locally with same DATABASE_URL

### Socket.IO Not Connecting

**Check**:
1. Frontend using correct Render URL
2. CORS settings in `server.js` include Render URL
3. Render logs show "Socket.IO initialized"

**CORS fix** (if needed):
```javascript
// server.js
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://frontend-ky7.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
};
```

### App Sleeping Too Often

Free tier sleeps after 15 min idle.

**Solutions**:
1. **Upgrade to paid plan** ($7/month - no sleep)
2. **Use uptime monitor** to ping every 14 minutes:
   - UptimeRobot (free)
   - Cron-job.org (free)
   - Set ping URL: `https://backend-socketio.onrender.com/health`

## Managing Your Service

### Redeploy
- **Auto**: Push to GitHub → Auto deploys
- **Manual**: Dashboard → **Manual Deploy** → **Deploy latest commit**

### View Logs
- Dashboard → **Logs** tab
- Real-time streaming logs

### Environment Variables
- Dashboard → **Environment** tab
- Add/Edit/Delete variables
- **Important**: Service auto-restarts after changing env vars

### Restart Service
- Dashboard → **Manual Deploy** → **Restart service**

### Metrics
- Dashboard → **Metrics** tab
- CPU, Memory, Bandwidth usage

### Custom Domain (Optional)
- Dashboard → **Settings** → **Custom Domain**
- Add your domain (e.g., api.yourdomain.com)
- Update DNS records as instructed

## Monitoring

### Uptime Monitoring (Prevent Sleep)

**UptimeRobot** (Free):
1. Go to https://uptimerobot.com
2. Add Monitor → HTTP(s)
3. URL: `https://backend-socketio.onrender.com/health`
4. Interval: **5 minutes**
5. This pings your app every 5 min → prevents sleep

## Summary Checklist

- [x] Render account created
- [x] Repository connected
- [x] Environment variables added (11 variables)
- [x] Build & Start commands configured
- [x] Service deployed successfully
- [x] Database connection working
- [x] Migrations run
- [x] Health endpoint responding
- [x] Socket.IO initialized
- [x] Frontend updated with Render URL
- [x] Real-time features tested

## Cost

**Render Free Tier:**
- ✅ **$0/month**
- ✅ 750 hours (31 days × 24 hours = 744 hours)
- ✅ 512MB RAM
- ✅ 100GB bandwidth

**Render Starter (if need always-on):**
- 💰 **$7/month**
- ✅ No sleep
- ✅ 512MB RAM
- ✅ Auto-scaling

## Your Architecture

```
┌─────────────────────────────┐
│   Frontend (Vercel)         │
│  frontend-ky7.vercel.app    │
└──────┬──────────────┬───────┘
       │              │
       │ REST API     │ Socket.IO
       │              │
       ▼              ▼
┌──────────────┐  ┌────────────────────┐
│   Vercel     │  │    Render.com      │
│  (REST API)  │  │   (Socket.IO)      │
│              │  │  backend-socketio  │
│  - Fast      │  │  .onrender.com     │
│  - Global    │  │                    │
└──────────────┘  └────────────────────┘
       │                    │
       └──────┬─────────────┘
              ▼
      ┌──────────────┐
      │ Aiven MySQL  │
      │ (Database)   │
      └──────────────┘
              │
              ▼
      ┌──────────────┐
      │Upstash Redis │
      │   (Cache)    │
      └──────────────┘
```

## Next Steps

1. ✅ Monitor logs for first few hours
2. ✅ Test all features from frontend
3. ✅ Setup uptime monitoring (prevent sleep)
4. ✅ Consider upgrading if high traffic ($7/month)

Congratulations! Your backend is now live on Render! 🎉
