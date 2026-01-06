# API DOCUMENTATION - KY-7 E-Commerce Backend

Base URL Production: `https://backend-node-5re9.onrender.com/api`

## 📑 MỤC LỤC

- [Authentication APIs](#authentication-apis)
- [Product APIs](#product-apis)
- [Category APIs](#category-apis)
- [Cart APIs](#cart-apis)
- [Order APIs](#order-apis)
- [Payment APIs](#payment-apis)
- [Address APIs](#address-apis)
- [Voucher APIs](#voucher-apis)
- [Upload APIs](#upload-apis)
- [Notification APIs](#notification-apis)
- [Chat/Message APIs](#chat-apis)

---

## 🔐 Authentication APIs

### 1. Register
```
POST /api/auth/register
Content-Type: application/json

Body:
{
  "username": "string",
  "email": "string",
  "password": "string",
  "fullName": "string" (optional)
}

Response:
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "user": {
      "_id": "string",
      "username": "string",
      "email": "string",
      "role": "user"
    }
  }
}
```

### 2. Login
```
POST /api/auth/login
Content-Type: application/json

Body:
{
  "email": "string",
  "password": "string"
}

Response:
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "user": { ... }
  }
}
```

### 3. Get Current User Profile
```
GET /api/auth/me
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "_id": "string",
    "username": "string",
    "email": "string",
    "role": "user",
    "createdAt": "date"
  }
}
```

### 4. Update Profile
```
PUT /api/auth/profile
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "fullName": "string",
  "phone": "string",
  "avatar": "string"
}
```

### 5. Change Password
```
PUT /api/auth/password
Authorization: Bearer {token}

Body:
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

---

## 📦 Product APIs

### 1. Get All Products
```
GET /api/products
Query params:
  - page: number (default: 1)
  - limit: number (default: 20)
  - search: string
  - category: categoryId
  - minPrice: number
  - maxPrice: number
  - sortBy: string (price, createdAt, name)
  - order: string (asc, desc)

Response:
{
  "success": true,
  "data": {
    "products": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 2. Get Product by ID
```
GET /api/products/:id

Response:
{
  "success": true,
  "data": {
    "_id": "string",
    "name": "string",
    "slug": "string",
    "description": "string",
    "price": number,
    "stock": number,
    "categoryId": {...},
    "images": [...],
    "variants": [...]
  }
}
```

### 3. Get Product by Slug
```
GET /api/products/slug/:slug

Response: Same as Get by ID
```

### 4. Create Product (Admin)
```
POST /api/products
Authorization: Bearer {admin_token}
Content-Type: application/json

Body:
{
  "name": "string",
  "description": "string",
  "price": number,
  "stock": number,
  "categoryId": "string",
  "images": [
    {
      "imageUrl": "string",
      "isPrimary": boolean
    }
  ],
  "variants": [...] (optional),
  "metaTitle": "string" (optional),
  "metaDescription": "string" (optional)
}
```

### 5. Update Product (Admin)
```
PUT /api/products/:id
Authorization: Bearer {admin_token}

Body: Same as Create Product
```

### 6. Delete Product (Admin)
```
DELETE /api/products/:id
Authorization: Bearer {admin_token}
```

---

## 📂 Category APIs

### 1. Get All Categories
```
GET /api/categories

Response:
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "name": "string",
      "slug": "string",
      "description": "string",
      "imageUrl": "string",
      "isActive": boolean
    }
  ]
}
```

### 2. Get Category by ID
```
GET /api/categories/:id
```

### 3. Get Category by Slug
```
GET /api/categories/slug/:slug
```

### 4. Create Category (Admin)
```
POST /api/categories
Authorization: Bearer {admin_token}

Body:
{
  "name": "string",
  "description": "string",
  "imageUrl": "string",
  "isActive": boolean
}
```

### 5. Update Category (Admin)
```
PUT /api/categories/:id
Authorization: Bearer {admin_token}
```

### 6. Delete Category (Admin)
```
DELETE /api/categories/:id
Authorization: Bearer {admin_token}
```

---

## 🛒 Cart APIs

### 1. Get Cart
```
GET /api/cart
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "_id": "string",
    "userId": "string",
    "items": [
      {
        "productId": {...},
        "quantity": number,
        "price": number
      }
    ],
    "totalAmount": number
  }
}
```

### 2. Add to Cart
```
POST /api/cart
Authorization: Bearer {token}

Body:
{
  "productId": "string",
  "quantity": number
}

Response:
{
  "success": true,
  "message": "Đã thêm vào giỏ hàng",
  "data": {
    "productId": {...},
    "quantity": number,
    "price": number
  }
}
```

### 3. Update Cart Item
```
PUT /api/cart/:itemId
Authorization: Bearer {token}

Body:
{
  "quantity": number
}
```

### 4. Remove from Cart
```
DELETE /api/cart/:itemId
Authorization: Bearer {token}
```

### 5. Clear Cart
```
DELETE /api/cart
Authorization: Bearer {token}
```

---

## 📋 Order APIs

### 1. Get My Orders
```
GET /api/orders/my
Authorization: Bearer {token}
Query params:
  - page: number
  - limit: number
  - status: string (pending, confirmed, shipping, delivered, cancelled)

Response:
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "orderNumber": "string",
      "userId": "string",
      "items": [...],
      "customerName": "string",
      "customerEmail": "string",
      "customerPhone": "string",
      "shippingAddress": "string",
      "shippingCity": "string",
      "shippingDistrict": "string",
      "shippingWard": "string",
      "paymentMethod": "cod|vnpay|zalopay",
      "paymentStatus": "pending|paid|failed",
      "orderStatus": "pending|confirmed|shipping|delivered|cancelled",
      "subtotal": number,
      "shippingFee": number,
      "discount": number,
      "total": number,
      "createdAt": "date"
    }
  ]
}
```

### 2. Get Order by ID
```
GET /api/orders/:orderId
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": { ... } // Order detail
}
```

### 3. Create Order
```
POST /api/orders
Authorization: Bearer {token}

Body:
{
  "customerName": "string",
  "customerEmail": "string",
  "customerPhone": "string",
  "shippingAddress": "string",
  "shippingCity": "string",
  "shippingDistrict": "string" (optional),
  "shippingWard": "string" (optional),
  "shippingNote": "string" (optional),
  "paymentMethod": "cod|vnpay|zalopay",
  "voucherCode": "string" (optional)
}

Response:
{
  "success": true,
  "data": { ... } // Created order
}
```

### 4. Cancel Order
```
PUT /api/orders/:orderId/cancel
Authorization: Bearer {token}

Body:
{
  "reason": "string" (optional)
}
```

### 5. Get All Orders (Admin)
```
GET /api/orders/admin/all
Authorization: Bearer {admin_token}
Query params:
  - page: number
  - limit: number
  - status: string
  - paymentStatus: string
  - search: string
```

### 6. Update Order Status (Admin)
```
PUT /api/orders/admin/:orderId/status
Authorization: Bearer {admin_token}

Body:
{
  "orderStatus": "confirmed|shipping|delivered|cancelled",
  "paymentStatus": "paid|failed" (optional),
  "note": "string" (optional)
}
```

### 7. Get Order Statistics (Admin)
```
GET /api/orders/admin/statistics
Authorization: Bearer {admin_token}
```

---

## 💳 Payment APIs

### 1. Create VNPay Payment
```
POST /api/payment/vnpay/create
Authorization: Bearer {token}

Body:
{
  "orderId": "string",
  "amount": number,
  "orderInfo": "string" (optional),
  "locale": "vn|en" (optional)
}

Response:
{
  "success": true,
  "data": {
    "paymentUrl": "string",
    "orderId": "string",
    "orderNumber": "string"
  }
}
```

### 2. VNPay Return (Callback)
```
GET /api/payment/vnpay/return
Query params: (Automatically sent by VNPay)
  - vnp_Amount
  - vnp_BankCode
  - vnp_ResponseCode
  - vnp_TxnRef
  - vnp_SecureHash
  - ...
```

### 3. VNPay IPN (Webhook)
```
GET /api/payment/vnpay/ipn
(Called by VNPay server)
```

### 4. Create ZaloPay Payment
```
POST /api/payment/zalopay/create
Authorization: Bearer {token}

Body:
{
  "orderId": "string",
  "amount": number
}
```

### 5. ZaloPay Callback
```
POST /api/payment/zalopay/callback
(Called by ZaloPay server)
```

### 6. Get Payment Status
```
GET /api/payment/status/:orderId
Authorization: Bearer {token}
```

---

## 📍 Address APIs

### 1. Get My Addresses
```
GET /api/addresses
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "userId": "string",
      "fullName": "string",
      "phone": "string",
      "address": "string",
      "city": "string",
      "district": "string",
      "ward": "string",
      "isDefault": boolean
    }
  ]
}
```

### 2. Get Address by ID
```
GET /api/addresses/:id
Authorization: Bearer {token}
```

### 3. Create Address
```
POST /api/addresses
Authorization: Bearer {token}

Body:
{
  "fullName": "string",
  "phone": "string",
  "address": "string",
  "city": "string",
  "district": "string" (optional),
  "ward": "string" (optional),
  "isDefault": boolean (optional)
}
```

### 4. Update Address
```
PUT /api/addresses/:id
Authorization: Bearer {token}

Body: Same as Create Address
```

### 5. Delete Address
```
DELETE /api/addresses/:id
Authorization: Bearer {token}
```

### 6. Set Default Address
```
PUT /api/addresses/:id/default
Authorization: Bearer {token}
```

---

## 🎟️ Voucher APIs

### 1. Get All Vouchers
```
GET /api/vouchers

Response:
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "code": "string",
      "description": "string",
      "type": "DISCOUNT|FREE_SHIP",
      "discountPercent": number,
      "maxDiscount": number,
      "minOrderAmount": number,
      "startDate": "date",
      "endDate": "date",
      "usageLimit": number,
      "usedCount": number,
      "isActive": boolean
    }
  ]
}
```

### 2. Validate Voucher
```
POST /api/vouchers/validate

Body:
{
  "code": "string",
  "orderAmount": number
}

Response:
{
  "success": true,
  "data": {
    "isValid": boolean,
    "voucher": {...},
    "discount": number,
    "message": "string"
  }
}
```

### 3. Create Voucher (Admin)
```
POST /api/vouchers
Authorization: Bearer {admin_token}

Body:
{
  "code": "string",
  "description": "string",
  "type": "DISCOUNT|FREE_SHIP",
  "discountPercent": number,
  "maxDiscount": number (optional),
  "minOrderAmount": number,
  "startDate": "date",
  "endDate": "date",
  "usageLimit": number (optional),
  "isActive": boolean
}
```

### 4. Update Voucher (Admin)
```
PUT /api/vouchers/:id
Authorization: Bearer {admin_token}
```

### 5. Delete Voucher (Admin)
```
DELETE /api/vouchers/:id
Authorization: Bearer {admin_token}
```

---

## 📤 Upload APIs

### 1. Upload Single Image
```
POST /api/upload/image
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
{
  "image": File
}

Response:
{
  "success": true,
  "data": {
    "url": "string",
    "publicId": "string"
  }
}
```

### 2. Upload Multiple Images
```
POST /api/upload/images
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
{
  "images": File[]
}

Response:
{
  "success": true,
  "data": [
    {
      "url": "string",
      "publicId": "string"
    }
  ]
}
```

### 3. Delete Image
```
DELETE /api/upload/image
Authorization: Bearer {token}

Body:
{
  "publicId": "string"
}
```

---

## 🔔 Notification APIs

### 1. Get My Notifications
```
GET /api/notifications
Authorization: Bearer {token}
Query params:
  - page: number
  - limit: number
  - isRead: boolean

Response:
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "userId": "string",
      "type": "order|payment|system",
      "title": "string",
      "message": "string",
      "data": object,
      "isRead": boolean,
      "createdAt": "date"
    }
  ]
}
```

### 2. Mark as Read
```
PUT /api/notifications/:id/read
Authorization: Bearer {token}
```

### 3. Mark All as Read
```
PUT /api/notifications/read-all
Authorization: Bearer {token}
```

### 4. Delete Notification
```
DELETE /api/notifications/:id
Authorization: Bearer {token}
```

---

## 💬 Chat/Message APIs

### 1. Get My Conversations
```
GET /api/chat/conversations
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "participants": [...],
      "lastMessage": {...},
      "unreadCount": number,
      "updatedAt": "date"
    }
  ]
}
```

### 2. Get Messages
```
GET /api/chat/messages/:conversationId
Authorization: Bearer {token}
Query params:
  - page: number
  - limit: number
```

### 3. Send Message
```
POST /api/chat/messages
Authorization: Bearer {token}

Body:
{
  "conversationId": "string" (optional, if new conversation),
  "receiverId": "string" (required if new conversation),
  "message": "string",
  "type": "text|image|file" (optional)
}
```

### 4. Mark Messages as Read
```
PUT /api/chat/messages/:conversationId/read
Authorization: Bearer {token}
```

---

## 🌐 Other APIs

### Sitemap
```
GET /api/sitemap.xml
Returns XML sitemap for SEO
```

---

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "string" (optional)
}
```

### Error Response
```json
{
  "success": false,
  "message": "string",
  "error": "string" (optional)
}
```

---

## 🔑 Authentication

Hầu hết các API đều yêu cầu authentication. Sử dụng JWT token trong header:

```
Authorization: Bearer {your_jwt_token}
```

Token nhận được sau khi login/register.

---

## 👥 User Roles

- **user**: Khách hàng thông thường
- **admin**: Quản trị viên (full access)

---

## 🚀 Test Accounts

### User Account
```
Email: test@example.com
Password: test123
```

### Admin Account
```
Email: admin@example.com
Password: admin123
```

---

## 📊 Pagination

Các API danh sách thường hỗ trợ pagination:

```
Query params:
  - page: number (default: 1)
  - limit: number (default: 20)

Response:
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 🛡️ Security

- Tất cả passwords được hash bằng bcrypt
- JWT tokens có thời hạn 30 ngày
- CORS được cấu hình cho frontend domain
- Rate limiting được áp dụng để chống spam
- Input validation trên tất cả endpoints

---

## 📞 Support

Nếu có vấn đề với API, vui lòng liên hệ qua:
- GitHub Issues
- Email support

---

**Last Updated:** January 6, 2026
**API Version:** 1.0.0
**Base URL:** https://backend-node-5re9.onrender.com/api
