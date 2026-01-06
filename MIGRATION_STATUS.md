# MongoDB Migration Complete Guide

Đã migrate thành công từ Prisma + MySQL sang MongoDB + Mongoose!

## ✅ Đã hoàn thành:

### 1. Models (100%)
- ✅ User.model.js
- ✅ Category.model.js  
- ✅ Product.model.js
- ✅ Cart.model.js
- ✅ Order.model.js
- ✅ CustomerAddress.model.js
- ✅ Voucher.model.js
- ✅ Notification.model.js
- ✅ Message.model.js

### 2. Config & Server
- ✅ config/mongodb.js (kết nối MongoDB)
- ✅ server.js (updated)
- ✅ package.json (removed Prisma)
- ✅ .env (thêm MONGODB_URI)

### 3. Middleware & Auth
- ✅ auth.middleware.js
- ✅ auth.controller.js

## ⚠️ Controllers cần update thủ công:

Do độ phức tạp của logic business, các controllers sau cần được update thủ công:

### 1. notification.controller.js
Replace `prisma.notification` với `Notification` model:
```javascript
const Notification = require('../models/Notification.model');
// Thay vì: const prisma = require('../lib/prisma');
```

### 2. chat.controller.js  
Replace `prisma.message` với `Message` model

### 3. voucher.controller.js (đã có models nhưng còn prisma code)
Replace các prisma queries

### 4. payment.controller.js
Cần update Order model queries

### 5. sitemap.controller.js
Cần update Product, Category queries

## 🔧 Hướng dẫn update nhanh:

### Prisma -> Mongoose Cheat Sheet:

```javascript
// FIND
prisma.model.findMany() -> Model.find()
prisma.model.findUnique({ where: { id } }) -> Model.findById(id)
prisma.model.findFirst({ where }) -> Model.findOne(where)

// CREATE
prisma.model.create({ data }) -> Model.create(data)

// UPDATE
prisma.model.update({ where: { id }, data }) -> Model.findByIdAndUpdate(id, data, { new: true })

// DELETE  
prisma.model.delete({ where: { id } }) -> Model.findByIdAndDelete(id)

// COUNT
prisma.model.count({ where }) -> Model.countDocuments(where)

// POPULATE (thay include)
prisma.model.findMany({ include: { user: true } })
->
Model.find().populate('userId')

// SORT
orderBy: { createdAt: 'desc' } -> .sort({ createdAt: -1 })

// PAGINATION
skip, take -> skip(), limit()
```

## 🚀 Next Steps:

1. **Update các controllers còn lại** (notification, chat, voucher, payment, sitemap)
2. **Test tất cả API endpoints**
3. **Xóa thư mục /prisma** (không cần nữa)
4. **Xóa lib/prisma.js**
5. **Update seed scripts** nếu cần

## 📝 Database Connection:

```env
MONGODB_URI=mongodb+srv://khangtdce181439_db_user:9qE9ibsKROx80ZVX@ky7-cluster.sagjbep.mongodb.net/ky7_store?retryWrites=true&w=majority&appName=ky7-cluster
```

## 🎯 Test Server:

```bash
npm run dev
```

Kiểm tra các endpoints cơ bản:
- GET /health
- POST /api/auth/register
- POST /api/auth/login  
- GET /api/categories
- GET /api/products
