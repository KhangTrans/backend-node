# E-Commerce Backend API

Hệ thống Backend hoàn chỉnh cho nền tảng thương mại điện tử với đầy đủ các chức năng: quản lý sản phẩm, đơn hàng, giỏ hàng, thanh toán, chat, thông báo và cache Redis.

## 🎯 Tổng quan Hệ thống

### Chức năng chính:
- ✅ **Xác thực & phân quyền** - Đăng ký, đăng nhập, JWT, Role-based Access Control
- ✅ **Quản lý sản phẩm** - CRUD sản phẩm, biến thể, hình ảnh
- ✅ **Quản lý danh mục** - Phân loại sản phẩm
- ✅ **Giỏ hàng** - Thêm, xóa, cập nhật số lượng
- ✅ **Đặt hàng** - Tạo đơn từ giỏ hàng hoặc mua ngay
- ✅ **Thanh toán** - COD, VNPay, ZaloPay
- ✅ **Voucher & Khuyến mãi** - Mã giảm giá, free ship
- ✅ **Địa chỉ giao hàng** - Quản lý đa địa chỉ
- ✅ **Chat real-time** - Socket.io, WebSocket
- ✅ **Thông báo** - Notification cho user & admin
- ✅ **Upload ảnh** - Cloudinary integration
- ✅ **Cache Redis** - Tối ưu hiệu năng
- ✅ **Sitemap** - SEO optimization

---

## 🛠️ Tech Stack

| Công nghệ | Mục đích |
|-----------|---------|
| **Node.js + Express.js** | Backend framework |
| **MongoDB** | NoSQL Database |
| **Redis** | Cache & Session |
| **Cloudinary** | Image storage & CDN |
| **JWT** | Authentication |
| **Socket.io** | Real-time chat/notification |
| **VNPay API** | Thanh toán VNPay |
| **ZaloPay API** | Thanh toán ZaloPay |
| **Dotenv** | Environment variables |

---

## 📋 Cài đặt & Setup

### 1. Clone Repository
```bash
git clone https://github.com/KhangTrans/backend-node.git
cd Backend
```

### 2. Cài đặt Dependencies
```bash
npm install
```

### 3. Cấu hình Environment Variables
Tạo file `.env` trong root folder:
```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your_super_secret_key_here_change_in_production
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# VNPay
VNPAY_TMNCODE=your_tmncode
VNPAY_HASHSECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paygate

# ZaloPay
ZALOPAY_APPID=your_app_id
ZALOPAY_KEY1=your_key1
ZALOPAY_KEY2=your_key2
ZALOPAY_ENDPOINT=https://sandbox.zalopay.com.vn/api/v2

# Socket.io
SOCKET_PORT=3000

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000
```

### 4. Khởi chạy Server
```bash
# Development mode (với nodemon)
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại: `http://localhost:5000`

---

## 🌐 Deployment

### Deploy trên Fly.io
```bash
flyctl deploy
```
Xem: [docs/DEPLOY_FLY.md](docs/DEPLOY_FLY.md)

### Deploy trên Railway
```bash
railway up
```
Xem: [docs/DEPLOY_RAILWAY.md](docs/DEPLOY_RAILWAY.md)

---

## 📁 Cấu trúc Project

```
Backend/
├── api/                    # API routes aggregator
├── config/                 # Cấu hình database, cache, payment
│   ├── cloudinary.js       # Image upload config
│   ├── database.js         # MongoDB connection
│   ├── mongodb.js          # MongoDB setup
│   ├── redis.js            # Redis client
│   ├── socket.js           # Socket.io config
│   ├── vnpay.js            # VNPay config
│   └── zalopay.js          # ZaloPay config
├── controllers/            # Business logic (13 controllers)
│   ├── auth.controller.js
│   ├── product.controller.js
│   ├── cart.controller.js
│   ├── order.controller.js
│   ├── payment.controller.js
│   ├── voucher.controller.js
│   ├── address.controller.js
│   ├── chat.controller.js
│   ├── notification.controller.js
│   ├── category.controller.js
│   ├── upload.controller.js
│   └── ...
├── models/                 # MongoDB schemas (9 models)
│   ├── User.model.js
│   ├── Product.model.js
│   ├── Cart.model.js
│   ├── Order.model.js
│   ├── Voucher.model.js
│   ├── Message.model.js
│   ├── Notification.model.js
│   └── ...
├── routes/                 # API routes (12 routers)
│   ├── auth.routes.js
│   ├── product.routes.js
│   ├── cart.routes.js
│   ├── order.routes.js
│   ├── payment.routes.js
│   └── ...
├── middleware/             # Custom middleware
│   ├── auth.middleware.js  # JWT protection & role check
│   └── cache.middleware.js # Redis cache layer
├── utils/                  # Helper functions
│   └── slug.js            # URL slug generator
├── scripts/                # Database seeding scripts
│   ├── seed-mongodb.js
│   ├── seed-products.js
│   ├── seed-categories.js
│   └── ...
├── docs/                   # Tài liệu chi tiết
│   ├── API_DOCUMENTATION.md
│   ├── DATABASE_ACCESS.md
│   ├── REDIS_CACHE.md
│   ├── UPLOAD_IMAGES.md
│   └── ...
├── .env                    # Environment variables
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies
├── server.js               # Entry point
└── README.md               # This file
```

---

## 🔐 Xác thực & Phân quyền

### Authentication Flow
1. User đăng ký → Email verified (nếu cần)
2. User đăng nhập → Nhận JWT token
3. Gửi token trong header: `Authorization: Bearer <token>`
4. Middleware xác thực & kiểm tra quyền

### Role-Based Access Control
- **user** - Khách hàng thông thường
- **admin** - Quản trị viên
- **vendor** - Nhà bán hàng (tùy chọn)

```javascript
// Ví dụ: Chỉ admin mới có thể xem tất cả orders
router.get('/admin/all', protect, authorize('admin'), getAllOrders);
```

---

## 📦 API Endpoints

### 🔑 Authentication (`/api/auth`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| POST | `/register` | Đăng ký tài khoản | ❌ |
| POST | `/login` | Đăng nhập | ❌ |
| GET | `/me` | Lấy thông tin user | ✅ |
| POST | `/logout` | Đăng xuất | ✅ |

### 📦 Products (`/api/products`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/` | Lấy danh sách sản phẩm (có phân trang, filter, search) | ❌ |
| GET | `/:id` | Chi tiết sản phẩm | ❌ |
| POST | `/` | Tạo sản phẩm mới | ✅ Admin |
| PUT | `/:id` | Cập nhật sản phẩm | ✅ Admin |
| DELETE | `/:id` | Xóa sản phẩm | ✅ Admin |

### 🛒 Cart (`/api/cart`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/` | Lấy giỏ hàng | ✅ |
| POST | `/` | Thêm sản phẩm vào giỏ | ✅ |
| **PUT** | `/:itemId` | **Tăng/Giảm số lượng** | ✅ |
| DELETE | `/:itemId` | Xóa sản phẩm khỏi giỏ | ✅ |
| DELETE | `/` | Xóa toàn bộ giỏ hàng | ✅ |

### 📋 Orders (`/api/orders`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| POST | `/` | Tạo đơn hàng từ giỏ hàng | ✅ |
| **POST** | `/buy-now` | **Mua ngay từ trang chi tiết** | ✅ |
| GET | `/my` | Lấy đơn hàng của user | ✅ |
| GET | `/:orderId` | Chi tiết đơn hàng | ✅ |
| PUT | `/:orderId/cancel` | Hủy đơn hàng | ✅ |
| GET | `/admin/all` | Lấy tất cả đơn hàng | ✅ Admin |
| PUT | `/admin/:orderId/status` | Cập nhật trạng thái đơn | ✅ Admin |

### 💳 Payment (`/api/payment`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| POST | `/vnpay/create` | Tạo link thanh toán VNPay | ✅ |
| GET | `/vnpay/return` | Callback từ VNPay | ❌ |
| POST | `/zalopay/create` | Tạo link thanh toán ZaloPay | ✅ |
| POST | `/zalopay/callback` | Callback từ ZaloPay | ❌ |

### 🏷️ Voucher (`/api/voucher`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/` | Danh sách voucher | ✅ |
| POST | `/validate` | Kiểm tra voucher hợp lệ | ✅ |
| POST | `/` | Tạo voucher | ✅ Admin |
| PUT | `/:id` | Cập nhật voucher | ✅ Admin |

### 📮 Address (`/api/address`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/` | Danh sách địa chỉ | ✅ |
| POST | `/` | Thêm địa chỉ mới | ✅ |
| PUT | `/:id` | Cập nhật địa chỉ | ✅ |
| DELETE | `/:id` | Xóa địa chỉ | ✅ |

### 💬 Chat (`/api/chat`)
| Event | Mô tả |
|-------|--------|
| `connect` | Kết nối Socket.io |
| `send_message` | Gửi tin nhắn |
| `receive_message` | Nhận tin nhắn |
| `typing` | Thông báo đang gõ |
| `disconnect` | Ngắt kết nối |

### 🔔 Notifications (`/api/notification`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/` | Lấy thông báo | ✅ |
| POST | `/mark-read/:id` | Đánh dấu đã đọc | ✅ |
| DELETE | `/:id` | Xóa thông báo | ✅ |

### 📤 Upload (`/api/upload`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| POST | `/` | Upload ảnh lên Cloudinary | ✅ Admin |
| DELETE | `/:publicId` | Xóa ảnh | ✅ Admin |

---

## 💾 Database Schema

### Collections chính:
1. **Users** - Tài khoản người dùng
2. **Products** - Sản phẩm, biến thể, hình ảnh
3. **Categories** - Danh mục sản phẩm
4. **Cart** - Giỏ hàng tạm thời
5. **Orders** - Lịch sử đơn hàng
6. **Vouchers** - Mã giảm giá & khuyến mãi
7. **Messages** - Chat messages
8. **Notifications** - Thông báo user
9. **CustomerAddresses** - Địa chỉ giao hàng

Xem chi tiết: [docs/DATABASE_ACCESS.md](docs/DATABASE_ACCESS.md)

---

## ⚡ Redis Caching

Sử dụng Redis để cache:
- **Danh sách sản phẩm** - TTL: 30 phút
- **Chi tiết sản phẩm** - TTL: 1 giờ
- **Session user** - TTL: 7 ngày
- **Voucher active** - TTL: 30 phút

Xem chi tiết: [docs/REDIS_CACHE.md](docs/REDIS_CACHE.md)

---

## 🔒 Bảo mật

- ✅ **Password hashing** - bcryptjs (salt rounds: 10)
- ✅ **JWT tokens** - Secure, Httponly cookies (khi cần)
- ✅ **CORS** - Whitelist frontend URL
- ✅ **Rate limiting** - Chống brute force
- ✅ **Input validation** - Express-validator
- ✅ **SQL Injection prevention** - MongoDB parameterized queries
- ✅ **XSS protection** - HTML escape, helmet.js
- ✅ **Environment variables** - Không commit credentials

---

## 🧪 Testing

### Sử dụng Postman/Thunder Client:

1. **Import collection:**
   - Download [Backend-API.postman_collection.json](Backend-API.postman_collection.json)
   - Import vào Postman

2. **Setup environment variables:**
   ```json
   {
     "baseURL": "http://localhost:5000",
     "token": "your-jwt-token-here",
     "userId": "user-id-here"
   }
   ```

3. **Test flow:**
   - Register → Login → Nhận token
   - Add to cart → Create order → Payment
   - Chat real-time
   - Admin: Manage products, orders, vouchers

---

## 🚀 Features Highlight

### 1. Thanh toán đa cổng
- COD (Tiền mặt khi nhận hàng)
- VNPay (Thẻ tín dụng, ATM)
- ZaloPay (Ví điện tử)

### 2. Voucher System
- Mã giảm giá (%)
- Miễn phí vận chuyển
- Min order amount
- Usage limit
- Time-based expiry

### 3. Chat Real-time
- Socket.io
- Instant messaging
- Typing indicator
- Online status

### 4. Notification System
- Order status updates
- New messages
- Promotion alerts
- Admin notifications

### 5. Product Variants
- Màu sắc (Color)
- Kích thước (Size)
- Tồn kho riêng biệt
- Giá khác nhau

### 6. Image Management
- Upload lên Cloudinary
- Multiple images per product
- Primary image selection
- CDN optimization

---

## 📚 Tài liệu chi tiết

| File | Nội dung |
|------|---------|
| [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) | Đầy đủ API documentation |
| [docs/DATABASE_ACCESS.md](docs/DATABASE_ACCESS.md) | Schema & queries |
| [docs/REDIS_CACHE.md](docs/REDIS_CACHE.md) | Caching strategy |
| [docs/UPLOAD_IMAGES.md](docs/UPLOAD_IMAGES.md) | Cloudinary setup |
| [docs/VOUCHER_SYSTEM.md](docs/VOUCHER_SYSTEM.md) | Voucher logic |
| [docs/DEPLOY_FLY.md](docs/DEPLOY_FLY.md) | Deploy trên Fly.io |
| [docs/DEPLOY_RAILWAY.md](docs/DEPLOY_RAILWAY.md) | Deploy trên Railway |
| [docs/FRONTEND_INTEGRATION.md](docs/FRONTEND_INTEGRATION.md) | Frontend integration guide |

---

## 🎯 Roadmap

- [ ] Email verification
- [ ] Forgot password flow
- [ ] Refresh token rotation
- [ ] Product reviews & ratings
- [ ] Wishlist feature
- [ ] Order tracking real-time
- [ ] Inventory management
- [ ] Analytics & reporting
- [ ] Multi-language support
- [ ] Mobile app API optimization

---

## 👨‍💻 Contribution

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📄 License

MIT License - xem [LICENSE](LICENSE) file

---

## 📞 Support

Nếu có câu hỏi hoặc vấn đề:
- 📧 Email: your-email@example.com
- 💬 GitHub Issues: [Issues page](https://github.com/KhangTrans/backend-node/issues)

---

## ⭐ Show your support

Give a ⭐️ if this project helped you!
