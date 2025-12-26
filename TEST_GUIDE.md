# 🧪 HƯỚNG DẪN TEST API GIỎ HÀNG & ĐƠN HÀNG

## 🚀 Chuẩn bị

1. **Khởi động server:**
```powershell
node server.js
```

2. **Server chạy tại:** `http://localhost:5000`

3. **Tạo tài khoản Admin (nếu chưa có):**
```powershell
node scripts/create-admin.js
```

**Admin credentials:**
- Email: `admin@backend.com`
- Password: `Admin@123456`

---

## 📋 FLOW TEST ĐẦY ĐỦ

### ✅ Step 1: Đăng ký User mới

**Request:**
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "123456",
  "fullName": "Test User"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": 2,
    "username": "testuser",
    "email": "test@example.com",
    "role": "user"
  }
}
```

**→ Lưu token để dùng cho các request tiếp theo!**

---

### ✅ Step 2: Thêm sản phẩm vào giỏ hàng

**Request 1 - Thêm sản phẩm đầu tiên:**
```http
POST http://localhost:5000/api/cart
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "productId": 1,
  "quantity": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã thêm vào giỏ hàng",
  "data": {
    "id": 1,
    "cartId": 1,
    "productId": 1,
    "quantity": 2,
    "price": "15990000.00",
    "product": {
      "name": "iPhone 15 Pro Max",
      ...
    }
  }
}
```

**Request 2 - Thêm sản phẩm thứ hai:**
```http
POST http://localhost:5000/api/cart
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "productId": 2,
  "quantity": 1
}
```

---

### ✅ Step 3: Xem giỏ hàng hiện tại

**Request:**
```http
GET http://localhost:5000/api/cart
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cart": {
      "id": 1,
      "userId": 2,
      "items": [
        {
          "id": 1,
          "productId": 1,
          "quantity": 2,
          "price": "15990000.00",
          "product": {
            "id": 1,
            "name": "iPhone 15 Pro Max",
            "slug": "iphone-15-pro-max",
            "price": "15990000.00",
            "stock": 48,
            "images": [
              {
                "imageUrl": "https://..."
              }
            ]
          }
        },
        {
          "id": 2,
          "productId": 2,
          "quantity": 1,
          "price": "25990000.00",
          "product": {
            "name": "MacBook Pro M3",
            ...
          }
        }
      ]
    },
    "summary": {
      "itemCount": 2,
      "totalQuantity": 3,
      "subtotal": "57970000.00"
    }
  }
}
```

---

### ✅ Step 4: Cập nhật số lượng sản phẩm

**Request:**
```http
PUT http://localhost:5000/api/cart/1
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "quantity": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã cập nhật giỏ hàng",
  "data": {
    "id": 1,
    "quantity": 3,
    "price": "15990000.00",
    ...
  }
}
```

---

### ✅ Step 5: Tạo đơn hàng từ giỏ

**Request:**
```http
POST http://localhost:5000/api/orders
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "customerName": "Nguyễn Văn A",
  "customerEmail": "nguyenvana@example.com",
  "customerPhone": "0901234567",
  "shippingAddress": "123 Đường Lê Lợi",
  "shippingCity": "TP. Hồ Chí Minh",
  "shippingDistrict": "Quận 1",
  "shippingWard": "Phường Bến Nghé",
  "shippingNote": "Giao giờ hành chính, gọi trước 15 phút",
  "paymentMethod": "cod"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đặt hàng thành công",
  "data": {
    "id": 1,
    "orderNumber": "ORD25122600001",
    "userId": 2,
    "customerName": "Nguyễn Văn A",
    "customerEmail": "nguyenvana@example.com",
    "customerPhone": "0901234567",
    "shippingAddress": "123 Đường Lê Lợi",
    "shippingCity": "TP. Hồ Chí Minh",
    "shippingDistrict": "Quận 1",
    "shippingWard": "Phường Bến Nghé",
    "shippingNote": "Giao giờ hành chính, gọi trước 15 phút",
    "paymentMethod": "cod",
    "paymentStatus": "pending",
    "orderStatus": "pending",
    "subtotal": "73960000.00",
    "shippingFee": "30000.00",
    "discount": "0.00",
    "total": "73990000.00",
    "items": [
      {
        "id": 1,
        "productId": 1,
        "productName": "iPhone 15 Pro Max",
        "productImage": "https://...",
        "price": "15990000.00",
        "quantity": 3,
        "subtotal": "47970000.00"
      },
      {
        "id": 2,
        "productId": 2,
        "productName": "MacBook Pro M3",
        "productImage": "https://...",
        "price": "25990000.00",
        "quantity": 1,
        "subtotal": "25990000.00"
      }
    ],
    "createdAt": "2025-12-26T...",
    "updatedAt": "2025-12-26T..."
  }
}
```

**→ Sau khi tạo đơn thành công, giỏ hàng sẽ tự động bị xóa!**

---

### ✅ Step 6: Xem lịch sử đơn hàng

**Request:**
```http
GET http://localhost:5000/api/orders/my
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "orderNumber": "ORD25122600001",
      "orderStatus": "pending",
      "paymentMethod": "cod",
      "paymentStatus": "pending",
      "total": "73990000.00",
      "customerName": "Nguyễn Văn A",
      "customerPhone": "0901234567",
      "shippingAddress": "123 Đường Lê Lợi",
      "shippingCity": "TP. Hồ Chí Minh",
      "items": [...],
      "createdAt": "2025-12-26T...",
      "updatedAt": "2025-12-26T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

**Lọc theo trạng thái:**
```http
GET http://localhost:5000/api/orders/my?status=pending
GET http://localhost:5000/api/orders/my?status=delivered
```

---

### ✅ Step 7: Xem chi tiết đơn hàng

**Request:**
```http
GET http://localhost:5000/api/orders/1
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderNumber": "ORD25122600001",
    "userId": 2,
    "items": [
      {
        "id": 1,
        "orderId": 1,
        "productId": 1,
        "productName": "iPhone 15 Pro Max",
        "productImage": "https://...",
        "price": "15990000.00",
        "quantity": 3,
        "subtotal": "47970000.00",
        "product": {
          "id": 1,
          "name": "iPhone 15 Pro Max",
          "slug": "iphone-15-pro-max",
          "price": "15990000.00",
          "stock": 47,
          "images": [...]
        }
      }
    ],
    "user": {
      "id": 2,
      "username": "testuser",
      "email": "test@example.com",
      "fullName": "Test User"
    },
    "customerName": "Nguyễn Văn A",
    "customerEmail": "nguyenvana@example.com",
    "customerPhone": "0901234567",
    "shippingAddress": "123 Đường Lê Lợi",
    "shippingCity": "TP. Hồ Chí Minh",
    "shippingDistrict": "Quận 1",
    "shippingWard": "Phường Bến Nghé",
    "shippingNote": "Giao giờ hành chính, gọi trước 15 phút",
    "paymentMethod": "cod",
    "paymentStatus": "pending",
    "orderStatus": "pending",
    "subtotal": "73960000.00",
    "shippingFee": "30000.00",
    "discount": "0.00",
    "total": "73990000.00",
    "paidAt": null,
    "shippedAt": null,
    "deliveredAt": null,
    "cancelledAt": null,
    "cancellationReason": null,
    "createdAt": "2025-12-26T...",
    "updatedAt": "2025-12-26T..."
  }
}
```

---

### ✅ Step 8: Login Admin

**Request:**
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@backend.com",
  "password": "Admin@123456"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@backend.com",
    "role": "admin"
  }
}
```

**→ Lưu admin token!**

---

### ✅ Step 9: Admin xem tất cả đơn hàng

**Request:**
```http
GET http://localhost:5000/api/orders/admin/all
Authorization: Bearer ADMIN_TOKEN_HERE
```

**Tìm kiếm đơn hàng:**
```http
GET http://localhost:5000/api/orders/admin/all?search=Nguyễn
GET http://localhost:5000/api/orders/admin/all?status=pending
GET http://localhost:5000/api/orders/admin/all?page=1&limit=20
```

---

### ✅ Step 10: Admin cập nhật trạng thái đơn hàng

**Request - Xác nhận đơn:**
```http
PUT http://localhost:5000/api/orders/admin/1/status
Authorization: Bearer ADMIN_TOKEN_HERE
Content-Type: application/json

{
  "orderStatus": "confirmed"
}
```

**Request - Đang giao hàng:**
```http
PUT http://localhost:5000/api/orders/admin/1/status
Authorization: Bearer ADMIN_TOKEN_HERE
Content-Type: application/json

{
  "orderStatus": "shipping"
}
```

**Request - Đã giao & Đã thanh toán:**
```http
PUT http://localhost:5000/api/orders/admin/1/status
Authorization: Bearer ADMIN_TOKEN_HERE
Content-Type: application/json

{
  "orderStatus": "delivered",
  "paymentStatus": "paid"
}
```

---

### ✅ Step 11: Admin xem thống kê

**Request:**
```http
GET http://localhost:5000/api/orders/admin/statistics
Authorization: Bearer ADMIN_TOKEN_HERE
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 1,
    "ordersByStatus": {
      "pending": 0,
      "processing": 0,
      "shipping": 0,
      "delivered": 1,
      "cancelled": 0
    },
    "totalRevenue": "73990000.00"
  }
}
```

---

### ✅ Step 12: User hủy đơn hàng

**Request:**
```http
PUT http://localhost:5000/api/orders/1/cancel
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "reason": "Đổi ý không mua nữa"
}
```

**Lưu ý:** Chỉ có thể hủy đơn ở trạng thái `pending`, `processing`, hoặc `confirmed`

---

## 📊 KẾT QUẢ TEST MONG ĐỢI

✅ **Cart:**
- Thêm sản phẩm vào giỏ thành công
- Xem giỏ hàng với tính tổng tiền chính xác
- Cập nhật số lượng thành công
- Xóa sản phẩm khỏi giỏ thành công

✅ **Order:**
- Tạo đơn hàng thành công với mã đơn tự động
- Giỏ hàng tự động xóa sau khi đặt hàng
- Tồn kho sản phẩm tự động giảm
- Xem lịch sử đơn hàng đầy đủ
- Xem chi tiết đơn hàng với đầy đủ thông tin
- User có thể hủy đơn (nếu chưa giao)

✅ **Admin:**
- Xem tất cả đơn hàng
- Tìm kiếm, lọc đơn hàng
- Cập nhật trạng thái đơn hàng
- Xem thống kê tổng quan

---

## 🎯 TEST CASES ĐẶC BIỆT

### ❌ Test thêm sản phẩm không tồn tại
```http
POST http://localhost:5000/api/cart
{
  "productId": 99999,
  "quantity": 1
}
```
→ Mong đợi: Error 404

### ❌ Test thêm số lượng vượt tồn kho
```http
POST http://localhost:5000/api/cart
{
  "productId": 1,
  "quantity": 99999
}
```
→ Mong đợi: Error 400 "Chỉ còn X sản phẩm trong kho"

### ❌ Test tạo đơn khi giỏ trống
```http
POST http://localhost:5000/api/orders
{...}
```
→ Mong đợi: Error 400 "Giỏ hàng trống"

### ❌ Test hủy đơn đã giao
```http
PUT http://localhost:5000/api/orders/1/cancel
```
→ Mong đợi: Error 400 "Không thể hủy đơn hàng ở trạng thái này"

---

## 🚀 SỬ DỤNG FILE test-cart-order.http

Mở file [test-cart-order.http](test-cart-order.http) trong VS Code và:
1. Thay `YOUR_TOKEN_HERE` bằng token thật
2. Click "Send Request" để test từng API
3. Xem kết quả ngay trong VS Code

---

## ✅ HOÀN THÀNH!

Tất cả API giỏ hàng và đơn hàng đã sẵn sàng và hoạt động!
