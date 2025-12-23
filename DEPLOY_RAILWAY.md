# Deploy lên Railway (Thay thế Vercel)

## Tại sao Railway?
- ✅ Hỗ trợ MySQL/Sequelize tốt hơn Vercel
- ✅ Free tier
- ✅ Deploy từ GitHub tự động
- ✅ Không có vấn đề với native bindings

## Các bước deploy lên Railway:

### 1. Đăng ký Railway
- Vào: https://railway.app/
- Sign up with GitHub
- Authorize Railway

### 2. Tạo New Project
- Click **"New Project"**
- Chọn **"Deploy from GitHub repo"**
- Chọn repository: **KhangTrans/backend-node**
- Click **Deploy Now**

### 3. Add Environment Variables
Railway sẽ tự động detect Node.js project. Thêm biến môi trường:

Click vào project → **Variables** tab → Add các biến:
```
DB_HOST=mysql-30cab664-trank7866-3a4c.c.aivencloud.com
DB_PORT=27426
DB_NAME=defaultdb
DB_USER=avnadmin
DB_PASSWORD=<your_password>
JWT_SECRET=<your_secret>
JWT_EXPIRE=7d
PORT=5000
```

### 4. Deploy Settings
Railway tự động detect:
- Start Command: `npm start`
- Build Command: `npm install`

### 5. Xong!
Railway sẽ cung cấp URL dạng: `https://your-app.up.railway.app`

---

## Hoặc dùng Render.com (Cũng free)

1. Vào https://render.com/
2. New → Web Service
3. Connect GitHub repo
4. Thêm environment variables
5. Deploy!

---

**Lưu ý:** Cả Railway và Render đều hỗ trợ MySQL + Sequelize tốt hơn Vercel serverless!

Bạn muốn thử platform nào? 🚀
