# 🚀 Hướng Dẫn Deploy với MongoDB

## ⚙️ Biến Môi Trường Cần Thiết

### 🔴 **QUAN TRỌNG**: Thêm biến môi trường sau vào platform deploy:

```env
# MongoDB Connection (BẮT BUỘC)
MONGODB_URI=mongodb+srv://khangtdce181439_db_user:9qE9ibsKROx80ZVX@ky7-cluster.sagjbep.mongodb.net/ky7_store?retryWrites=true&w=majority&appName=ky7-cluster

# JWT
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=dsom4uuux
CLOUDINARY_API_KEY=456735213468847
CLOUDINARY_API_SECRET=1o0dN-j_hSDrj3AuyFd2Ce8uozI

# URLs
FRONTEND_URL=https://khangtrandev.id.vn
API_URL=https://your-backend-url.vercel.app

# Redis (Optional)
REDIS_ENABLED=true
UPSTASH_REDIS_REST_URL=https://exact-terrapin-53504.upstash.io
UPSTASH_REDIS_REST_TOKEN=AdEAAAIncDFiNzEyN2M2MjU2ZDM0NDU2OWNkMThiOGQyZGQ3MTU3N3AxNTM1MDQ

# Payment Return URLs
VNPAY_RETURN_URL=https://khangtrandev.id.vn/payment/vnpay/return
ZALOPAY_RETURN_URL=https://khangtrandev.id.vn/payment/zalopay/return

# Node Environment
NODE_ENV=production
PORT=5000
```

---

## 📦 Deploy lên các platforms

### 1️⃣ **Vercel** (Serverless)

#### Bước 1: Chuẩn bị
```bash
# Install Vercel CLI (nếu chưa có)
npm i -g vercel
```

#### Bước 2: Deploy
```bash
vercel
```

#### Bước 3: Thêm biến môi trường
1. Vào Vercel Dashboard
2. Chọn project
3. Settings → Environment Variables
4. Thêm tất cả biến môi trường ở trên
5. **ĐẶC BIỆT**: Thêm `MONGODB_URI` với connection string MongoDB Atlas

#### Lưu ý:
- ✅ Vercel hỗ trợ MongoDB hoàn toàn
- ✅ Không cần build command với Prisma nữa
- ❌ Socket.IO có thể không hoạt động tốt (serverless limitation)
- ✅ Các API REST hoạt động bình thường

---

### 2️⃣ **Railway** (Persistent Server - Khuyên dùng cho Socket.IO)

#### Bước 1: Push code lên GitHub

#### Bước 2: Connect Railway
1. Vào https://railway.app
2. New Project → Deploy from GitHub
3. Chọn repository

#### Bước 3: Thêm biến môi trường
1. Variables tab
2. Add tất cả biến môi trường
3. **MONGODB_URI** là bắt buộc

#### Bước 4: Deploy
Railway tự động deploy khi push code mới

#### Lưu ý:
- ✅ Hỗ trợ Socket.IO tốt (persistent server)
- ✅ Có thể dùng Railway MongoDB hoặc MongoDB Atlas
- ✅ Free tier: 500 hours/month

---

### 3️⃣ **Fly.io** (Global Edge Network)

#### Bước 1: Install Fly CLI
```bash
# Windows
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

#### Bước 2: Login & Deploy
```bash
# Login
fly auth login

# Deploy
fly deploy

# Set secrets
fly secrets set MONGODB_URI="mongodb+srv://..."
fly secrets set JWT_SECRET="your_secret"
fly secrets set CLOUDINARY_CLOUD_NAME="..."
# ... thêm các secrets khác
```

#### Lưu ý:
- ✅ Hỗ trợ Socket.IO tốt
- ✅ Global edge network (nhanh hơn)
- ✅ Free tier: 3 VMs shared-cpu-1x

---

### 4️⃣ **Render** (Alternative)

#### Bước 1: Connect GitHub
1. Vào https://render.com
2. New → Web Service
3. Connect repository

#### Bước 2: Cấu hình
- **Build Command**: `npm install`
- **Start Command**: `npm start`

#### Bước 3: Environment Variables
Thêm tất cả biến môi trường, đặc biệt `MONGODB_URI`

#### Lưu ý:
- ✅ Hỗ trợ Socket.IO
- ✅ Free tier có sleep sau 15 phút không dùng
- ✅ Dễ setup nhất

---

## 🗄️ MongoDB Atlas Network Access

### ⚠️ **QUAN TRỌNG**: Whitelist IP

Khi deploy, cần whitelist IP của server:

1. Vào MongoDB Atlas Dashboard
2. Network Access → Add IP Address
3. Chọn một trong hai:
   - **Allow Access from Anywhere** (`0.0.0.0/0`) - Dễ nhất nhưng kém bảo mật
   - **Add Current IP Address** - Thêm IP của từng platform

#### IP cần whitelist:
- **Vercel**: 0.0.0.0/0 (do IPs động)
- **Railway**: Có thể lấy IP static (tùy plan)
- **Fly.io**: 0.0.0.0/0 (IPs động)
- **Render**: 0.0.0.0/0 (IPs động)

---

## 🔍 Kiểm Tra Sau Khi Deploy

### Test health endpoint:
```bash
curl https://your-app.vercel.app/health
```

Response mong đợi:
```json
{
  "status": "ok",
  "timestamp": "...",
  "database": "MongoDB configured"
}
```

### Test MongoDB connection:
```bash
curl https://your-app.vercel.app/api/categories
```

Nếu trả về categories hoặc empty array `[]` → MongoDB connected ✅

### Test auth:
```bash
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123"}'
```

---

## ❌ Những gì KHÔNG CẦN làm nữa

- ❌ `prisma generate` - Không dùng Prisma nữa
- ❌ `prisma migrate deploy` - Không có migrations
- ❌ MySQL database - Dùng MongoDB rồi
- ❌ DATABASE_URL - Thay bằng MONGODB_URI

---

## 🐛 Troubleshooting

### Lỗi: "Cannot find module '@prisma/client'"
→ Đảm bảo đã xóa hết code Prisma và chạy `npm install`

### Lỗi: "MongooseServerSelectionError"
→ Kiểm tra:
1. MONGODB_URI đúng chưa
2. IP đã được whitelist chưa
3. Username/password đúng chưa

### Lỗi: "Connection timeout"
→ Whitelist IP `0.0.0.0/0` trong MongoDB Atlas Network Access

### Socket.IO không hoạt động trên Vercel
→ Deploy lên Railway, Render hoặc Fly.io thay vì

---

## 📊 So sánh Platforms cho MongoDB

| Platform | Socket.IO | MongoDB | Free Tier | Khuyến nghị |
|----------|-----------|---------|-----------|-------------|
| Vercel | ❌ Hạn chế | ✅ Tốt | ✅ Unlimited | REST API only |
| Railway | ✅ Tốt | ✅ Tốt | ⚠️ 500h/month | Khuyên dùng |
| Fly.io | ✅ Tốt | ✅ Tốt | ✅ 3 VMs | Tốt cho global |
| Render | ✅ Tốt | ✅ Tốt | ⚠️ Auto-sleep | Dễ setup |

---

## ✅ Checklist Deploy

- [ ] Đã xóa hết code Prisma
- [ ] Đã thêm MONGODB_URI vào biến môi trường
- [ ] MongoDB Atlas whitelist IP: 0.0.0.0/0
- [ ] Test local: `npm run dev` → Server chạy OK
- [ ] Push code lên GitHub
- [ ] Deploy lên platform
- [ ] Thêm tất cả environment variables
- [ ] Test health endpoint
- [ ] Test API endpoints
- [ ] Test auth (register/login)
- [ ] Cập nhật FRONTEND_URL nếu cần

---

**Chúc bạn deploy thành công! 🚀**
