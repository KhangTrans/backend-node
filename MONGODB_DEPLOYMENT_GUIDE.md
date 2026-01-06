# Hướng Dẫn Deploy MongoDB và Chuyển Đổi từ Prisma

## 📋 Tổng Quan

Hướng dẫn này sẽ giúp bạn:
1. Tạo database MongoDB trên cloud (MongoDB Atlas - FREE)
2. Cấu hình kết nối MongoDB
3. Chuyển đổi từ Prisma sang Mongoose
4. Migrate dữ liệu (nếu cần)

---

## 🚀 Bước 1: Tạo MongoDB Atlas (FREE Forever)

### 1.1. Đăng ký MongoDB Atlas

1. Truy cập: https://www.mongodb.com/cloud/atlas/register
2. Đăng ký tài khoản (FREE) với email
3. Chọn plan **M0 Sandbox** (FREE forever, 512MB storage)

### 1.2. Tạo Cluster

1. Sau khi đăng nhập, click **"Build a Database"**
2. Chọn **FREE Shared Tier** (M0)
3. Chọn Cloud Provider:
   - **AWS** (khuyên dùng)
   - Region: **Singapore (ap-southeast-1)** (gần Việt Nam nhất)
4. Cluster Name: `ky7-cluster` (hoặc tên bạn muốn)
5. Click **"Create"**

### 1.3. Cấu hình Security

#### A. Tạo Database User

1. Trong phần **Security > Database Access**
2. Click **"Add New Database User"**
3. Authentication Method: **Password**
4. Username: `ky7_admin` (hoặc tên bạn muốn)
5. Password: Tạo mật khẩu mạnh (lưu lại!)
6. Database User Privileges: **Read and write to any database**
7. Click **"Add User"**

#### B. Whitelist IP Address

1. Trong phần **Security > Network Access**
2. Click **"Add IP Address"**
3. Chọn **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ Chỉ dùng cho development/testing
   - Production nên chỉ whitelist IP của server
4. Click **"Confirm"**

### 1.4. Lấy Connection String

1. Trong phần **Database**, click **"Connect"** trên cluster của bạn
2. Chọn **"Connect your application"**
3. Driver: **Node.js**
4. Version: **4.1 or later**
5. Copy connection string, ví dụ:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

6. Thay thế `<username>` và `<password>` bằng thông tin user bạn vừa tạo
7. Thêm tên database sau `.mongodb.net/`, ví dụ:
   ```
   mongodb+srv://ky7_admin:your_password@cluster0.xxxxx.mongodb.net/ky7_store?retryWrites=true&w=majority
   ```

---

## 🔧 Bước 2: Cài Đặt MongoDB Driver

### 2.1. Gỡ Prisma và Cài Mongoose

```powershell
# Gỡ Prisma
npm uninstall prisma @prisma/client

# Cài Mongoose
npm install mongoose

# Cài thêm validator (optional nhưng khuyên dùng)
npm install validator
```

---

## 📝 Bước 3: Cấu Hình Project

### 3.1. Cập nhật `.env`

Tạo/cập nhật file `.env`:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://ky7_admin:your_password@cluster0.xxxxx.mongodb.net/ky7_store?retryWrites=true&w=majority

# Hoặc nếu dùng MongoDB local
# MONGODB_URI=mongodb://localhost:27017/ky7_store

# Các biến môi trường khác
NODE_ENV=development
PORT=3000
JWT_SECRET=your_jwt_secret_here
```

### 3.2. Tạo file config MongoDB

Tạo file `config/mongodb.js`:

```javascript
const mongoose = require('mongoose');

const connectMongoDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Các options này không cần thiết từ Mongoose 6+
      // nhưng có thể thêm nếu muốn
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { connectMongoDB, mongoose };
```

---

## 🗄️ Bước 4: Tạo Mongoose Models

### 4.1. Cấu trúc Models

Tạo các file model trong thư mục `models/`:

#### `models/User.model.js`:

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  fullName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // Tự động tạo createdAt và updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index cho performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

// Hash password trước khi save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method để compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual populate (nếu cần)
userSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'createdBy'
});

const User = mongoose.model('User', userSchema);

module.exports = User;
```

#### `models/Category.model.js`:

```javascript
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index
categorySchema.index({ slug: 1 });
categorySchema.index({ name: 1 });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
```

#### `models/Product.model.js`:

```javascript
const mongoose = require('mongoose');

const productImageSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true,
    maxlength: 500
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: true });

const productVariantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  value: {
    type: String,
    required: true,
    maxlength: 100
  },
  priceAdjustment: {
    type: Number,
    default: 0
  },
  stockAdjustment: {
    type: Number,
    default: 0
  }
}, { _id: true });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  metaTitle: String,
  metaDescription: String,
  metaKeywords: String,
  canonicalUrl: String,
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [productImageSchema],
  variants: [productVariantSchema]
}, {
  timestamps: true
});

// Indexes
productSchema.index({ slug: 1 });
productSchema.index({ categoryId: 1 });
productSchema.index({ createdBy: 1 });
productSchema.index({ name: 'text', description: 'text' }); // Text search

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
```

#### `models/Cart.model.js`:

```javascript
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true
  },
  variantInfo: {
    type: String
  }
}, { _id: true });

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema]
}, {
  timestamps: true
});

// Index
cartSchema.index({ userId: 1 });

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
```

#### `models/Order.model.js`:

```javascript
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  variantInfo: String
}, { _id: true });

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'vnpay', 'zalopay', 'card'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  shippingAddress: {
    fullName: String,
    phone: String,
    address: String,
    city: String,
    district: String,
    ward: String
  },
  notes: String,
  trackingNumber: String
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ userId: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
```

#### `models/CustomerAddress.model.js`:

```javascript
const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: true,
    maxlength: 100
  },
  phone: {
    type: String,
    required: true,
    maxlength: 20
  },
  address: {
    type: String,
    required: true,
    maxlength: 255
  },
  city: {
    type: String,
    required: true,
    maxlength: 100
  },
  district: {
    type: String,
    maxlength: 100
  },
  ward: {
    type: String,
    maxlength: 100
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index
addressSchema.index({ userId: 1 });

const CustomerAddress = mongoose.model('CustomerAddress', addressSchema);

module.exports = CustomerAddress;
```

#### `models/Voucher.model.js`:

```javascript
const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: String,
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  maxDiscount: Number,
  usageLimit: Number,
  usedCount: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index
voucherSchema.index({ code: 1 });
voucherSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

const Voucher = mongoose.model('Voucher', voucherSchema);

module.exports = Voucher;
```

#### `models/Notification.model.js`:

```javascript
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['order', 'promotion', 'system', 'message'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true
  },
  link: String,
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
```

#### `models/Message.model.js`:

```javascript
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
```

---

## 🔄 Bước 5: Cập Nhật server.js

Thay thế trong file `server.js`:

```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectMongoDB } = require('./config/mongodb');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const addressRoutes = require('./routes/address.routes');
const voucherRoutes = require('./routes/voucher.routes');
const uploadRoutes = require('./routes/upload.routes');
const notificationRoutes = require('./routes/notification.routes');
const chatRoutes = require('./routes/chat.routes');
const paymentRoutes = require('./routes/payment.routes');
const sitemapRoutes = require('./routes/sitemap.routes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api', sitemapRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    database: 'MongoDB',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

const PORT = process.env.PORT || 3000;

// Connect to MongoDB then start server
const startServer = async () => {
  try {
    await connectMongoDB();
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Socket.IO setup (nếu có)
    if (process.env.ENABLE_SOCKET === 'true') {
      const { initSocket } = require('./config/socket');
      initSocket(server);
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
```

---

## 🔧 Bước 6: Cập Nhật package.json

```json
{
  "name": "backend-api",
  "version": "2.0.0",
  "description": "Backend API with MongoDB",
  "main": "server.js",
  "engines": {
    "node": "24.x"
  },
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node scripts/seed-mongodb.js"
  },
  "keywords": [
    "nodejs",
    "express",
    "mongodb",
    "mongoose",
    "authentication"
  ],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@upstash/redis": "^1.36.0",
    "axios": "^1.13.2",
    "bcryptjs": "^2.4.3",
    "cloudinary": "^1.41.3",
    "cors": "^2.8.5",
    "dateformat": "^5.0.3",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-validator": "^7.0.1",
    "jsonwebtoken": "^9.0.2",
    "moment": "^2.30.1",
    "mongoose": "^8.0.0",
    "multer": "^2.0.2",
    "multer-storage-cloudinary": "^4.0.0",
    "redis": "^5.10.0",
    "socket.io": "^4.8.3",
    "validator": "^13.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## 📊 Bước 7: Seed Data (Optional)

Tạo file `scripts/seed-mongodb.js`:

```javascript
const { connectMongoDB, mongoose } = require('../config/mongodb');
const User = require('../models/User.model');
const Category = require('../models/Category.model');
const Product = require('../models/Product.model');

const seedData = async () => {
  try {
    await connectMongoDB();
    
    console.log('🧹 Cleaning database...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    
    console.log('👤 Creating admin user...');
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      fullName: 'Administrator',
      role: 'admin'
    });
    
    console.log('📁 Creating categories...');
    const categories = await Category.insertMany([
      { name: 'Electronics', slug: 'electronics', description: 'Electronic devices' },
      { name: 'Fashion', slug: 'fashion', description: 'Clothing and accessories' },
      { name: 'Books', slug: 'books', description: 'Books and magazines' }
    ]);
    
    console.log('📦 Creating products...');
    await Product.insertMany([
      {
        name: 'iPhone 15 Pro',
        slug: 'iphone-15-pro',
        description: 'Latest iPhone model',
        price: 29990000,
        stock: 50,
        categoryId: categories[0]._id,
        createdBy: admin._id,
        images: [{
          imageUrl: 'https://example.com/iphone.jpg',
          isPrimary: true,
          order: 0
        }]
      },
      {
        name: 'Nike Air Max',
        slug: 'nike-air-max',
        description: 'Comfortable running shoes',
        price: 2990000,
        stock: 100,
        categoryId: categories[1]._id,
        createdBy: admin._id
      }
    ]);
    
    console.log('✅ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedData();
```

---

## 🚀 Bước 8: Test & Deploy

### 8.1. Test Local

```powershell
# Cài dependencies
npm install

# Chạy server
npm run dev

# Test API
curl http://localhost:3000/api/health
```

### 8.2. Deploy lên Production

#### Vercel / Railway / Render:

1. Thêm biến môi trường `MONGODB_URI` trong dashboard
2. Deploy như bình thường
3. MongoDB Atlas sẽ tự động accept connections

#### Fly.io:

```powershell
# Set secret
flyctl secrets set MONGODB_URI="mongodb+srv://..."

# Deploy
flyctl deploy
```

---

## 🔍 Bước 9: Monitoring & Optimization

### 9.1. MongoDB Atlas Dashboard

- **Metrics**: Xem connections, queries, performance
- **Real-time**: Monitor queries đang chạy
- **Alerts**: Cài đặt cảnh báo khi database đạt limit

### 9.2. Best Practices

1. **Indexes**: Tạo indexes cho các field thường query
2. **Connection Pooling**: Mongoose tự động handle
3. **Pagination**: Luôn dùng `limit()` và `skip()`
4. **Lean Queries**: Dùng `.lean()` khi không cần Mongoose methods
5. **Select Fields**: Chỉ select các fields cần thiết

```javascript
// Good
const users = await User.find().select('username email').lean();

// Avoid
const users = await User.find(); // Lấy tất cả fields
```

---

## 📚 So Sánh Prisma vs Mongoose

| Feature | Prisma | Mongoose |
|---------|---------|----------|
| Type Safety | ✅ Excellent (auto-generated) | ⚠️ Manual (TypeScript) |
| Learning Curve | 🟢 Easy | 🟡 Medium |
| Performance | 🟡 Good | 🟢 Excellent |
| Flexibility | 🟡 Limited | 🟢 Very flexible |
| Migrations | ✅ Auto | ❌ Manual |
| MongoDB Support | ⚠️ Basic | ✅ Full featured |
| Relationships | 🟡 Virtual | 🟢 Native populate |
| Schema Validation | ✅ Built-in | ✅ Built-in |

---

## ❓ Troubleshooting

### Lỗi: "MongooseServerSelectionError"

- ✅ Check MONGODB_URI đúng format
- ✅ Check IP đã được whitelist
- ✅ Check username/password đúng
- ✅ Check internet connection

### Lỗi: "Authentication failed"

- ✅ Username/password trong connection string đúng
- ✅ User có quyền read/write database

### Lỗi: "Connection timeout"

- ✅ Network Access trong Atlas đã allow IP
- ✅ Firewall không block MongoDB ports

---

## 📞 Support

- MongoDB Docs: https://docs.mongodb.com/
- Mongoose Docs: https://mongoosejs.com/
- MongoDB Atlas: https://cloud.mongodb.com/

---

## ✅ Checklist Migration

- [ ] Tạo MongoDB Atlas account
- [ ] Tạo cluster và database
- [ ] Tạo user và whitelist IP
- [ ] Copy connection string
- [ ] Gỡ Prisma, cài Mongoose
- [ ] Tạo config/mongodb.js
- [ ] Chuyển đổi tất cả models
- [ ] Cập nhật controllers
- [ ] Cập nhật server.js
- [ ] Test local
- [ ] Seed data
- [ ] Deploy production
- [ ] Test production

---

**Chúc bạn migration thành công! 🎉**
