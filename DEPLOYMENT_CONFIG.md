# 🚀 Hướng dẫn Config cho Render Deployment

## 📍 Backend Domain trên Render
```
https://backend-node-5re9.onrender.com
```

---

## 🔧 Environment Variables cần set trên Render Dashboard

Vào **Settings → Environment Variables** và add tất cả các biến dưới đây:

### 1. Database & Cache
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
REDIS_HOST=your-redis-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

### 2. Authentication
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
```

### 3. Cloudinary (Image Upload)
```env
CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 4. VNPay Payment
```env
VNPAY_TMN_CODE=BDTRQ8G8
VNPAY_HASH_SECRET=C1VQKHGREPTR1H55PRKBZV5OX3LSDQWS
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_API=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
VNPAY_RETURN_URL=https://khangtrandev.id.vn/payment/vnpay/return
```

### 5. ZaloPay Payment ⚠️ QUAN TRỌNG
```env
ZALOPAY_APP_ID=554
ZALOPAY_KEY1=8NdU5pG5R2spGHGhyO99HN1OhD8IQJBn
ZALOPAY_KEY2=uUfsWgfLkRLzq6W2uNXTCxrfxs51auny
ZALOPAY_ENDPOINT=https://sb-openapi.zalopay.vn/v2/create
ZALOPAY_CALLBACK_URL=https://backend-node-5re9.onrender.com/api/payment/zalopay/callback
ZALOPAY_RETURN_URL=https://khangtrandev.id.vn/payment/zalopay/return
```

### 6. Frontend & Backend URLs
```env
FRONTEND_URL=https://khangtrandev.id.vn
BACKEND_URL=https://backend-node-5re9.onrender.com
PORT=5000
NODE_ENV=production
```

### 7. Socket.io (Real-time Chat)
```env
SOCKET_PORT=3000
SOCKET_ALLOW_ORIGIN=https://khangtrandev.id.vn
```

---

## 📋 Checklist trước khi Deploy

- [ ] Update `FRONTEND_URL` với domain frontend của bạn
- [ ] Update `ZALOPAY_RETURN_URL` với frontend URL
- [ ] Update `VNPAY_RETURN_URL` với frontend URL
- [ ] Verify ZaloPay credentials (KEY1, KEY2)
- [ ] Test callback URL: `https://backend-node-5re9.onrender.com/api/payment/zalopay/callback`
- [ ] Verify MongoDB URI bao gồm credentials
- [ ] Verify Redis credentials từ Upstash

---

## 🔍 Verify các URLs sau khi Deploy

### 1. Test Backend Health
```bash
curl https://backend-node-5re9.onrender.com/health
# Hoặc check logs trên Render Dashboard
```

### 2. Test ZaloPay Callback Route
```bash
curl -X POST https://backend-node-5re9.onrender.com/api/payment/zalopay/callback \
  -H "Content-Type: application/json" \
  -d '{"data":"test","mac":"test"}'
```

### 3. Verify CORS
Các request từ frontend phải được accept:
```javascript
// Frontend
fetch('https://backend-node-5re9.onrender.com/api/orders', {
  headers: { 'Authorization': 'Bearer token' }
})
```

---

## ⚠️ Common Issues & Solutions

### 1. ZaloPay Callback không nhận được
**Nguyên nhân:** Callback URL sai hoặc không HTTPS
**Giải pháp:** 
- Verify `ZALOPAY_CALLBACK_URL=https://backend-node-5re9.onrender.com/api/payment/zalopay/callback`
- Check logs: Render Dashboard → Runtime logs

### 2. CORS Error từ Frontend
**Nguyên nhân:** Frontend URL không match `FRONTEND_URL` env var
**Giải pháp:**
```javascript
// server.js
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### 3. Render dyno tự ngủ (Free tier)
**Nguyên nhân:** Free tier Render tự ngủ sau 15 phút không hoạt động
**Giải pháp:**
- Upgrade lên paid plan ($7/month)
- Hoặc dùng uptime service: https://uptimerobot.com

### 4. Redis Connection Timeout
**Nguyên nhân:** Redis credentials sai
**Giải pháp:**
- Verify `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- Test: `redis-cli -h host -p port -a password ping`

---

## 🔄 Deploy Flow

1. **Local Development**
   ```bash
   npm run dev  # Dùng localhost URLs
   ```

2. **Staging/Production**
   ```bash
   # Push code lên GitHub
   git push origin main
   
   # Render tự động build & deploy
   # (nếu connect với GitHub repo)
   ```

3. **Update Environment Variables**
   - Render Dashboard → Settings → Environment Variables
   - Add tất cả biến từ section trên
   - Save (tự động redeploy)

4. **Verify Deployment**
   - Check deployment logs
   - Test API endpoints
   - Test payment flow (ZaloPay, VNPay)

---

## 📞 Support

Nếu gặp issue:
1. Check **Render Logs** → Runtime
2. Check **Application Logs** từ code
3. Verify env vars lại
4. Test locally trước khi deploy

---

## 🔐 Security Notes

- ✅ Không commit `.env` file
- ✅ Dùng HTTPS cho tất cả URLs
- ✅ Render cấp SSL certificate miễn phí
- ✅ Định kỳ rotate JWT_SECRET
- ✅ Store sensitive keys trong Render Environment, không hardcode
