# 🛒 API Giỏ Hàng & Đơn Hàng

## 📦 Giỏ Hàng (Cart)

### 1. Xem giỏ hàng
```http
GET /api/cart
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cart": {
      "id": 1,
      "userId": 1,
      "items": [
        {
          "id": 1,
          "productId": 5,
          "quantity": 2,
          "price": "15990000.00",
          "product": {
            "id": 5,
            "name": "iPhone 15 Pro Max",
            "slug": "iphone-15-pro-max",
            "images": [
              {
                "imageUrl": "https://..."
              }
            ]
          }
        }
      ]
    },
    "summary": {
      "itemCount": 1,
      "totalQuantity": 2,
      "subtotal": "31980000.00"
    }
  }
}
```

### 2. Thêm sản phẩm vào giỏ
```http
POST /api/cart
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": 5,
  "quantity": 1
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
    "productId": 5,
    "quantity": 1,
    "price": "15990000.00"
  }
}
```

### 3. Cập nhật số lượng
```http
PUT /api/cart/:itemId
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantity": 3
}
```

### 4. Xóa sản phẩm khỏi giỏ
```http
DELETE /api/cart/:itemId
Authorization: Bearer {token}
```

### 5. Xóa toàn bộ giỏ hàng
```http
DELETE /api/cart
Authorization: Bearer {token}
```

---

## 📋 Đơn Hàng (Orders)

### 1. Tạo đơn hàng từ giỏ hàng
```http
POST /api/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "customerName": "Nguyễn Văn A",
  "customerEmail": "customer@example.com",
  "customerPhone": "0901234567",
  "shippingAddress": "123 Đường ABC",
  "shippingCity": "TP. Hồ Chí Minh",
  "shippingDistrict": "Quận 1",
  "shippingWard": "Phường Bến Nghé",
  "shippingNote": "Giao giờ hành chính",
  "paymentMethod": "cod"
}
```

**Payment Methods:**
- `cod` - Thanh toán khi nhận hàng
- `bank_transfer` - Chuyển khoản ngân hàng
- `momo` - Ví MoMo
- `vnpay` - VNPay
- `credit_card` - Thẻ tín dụng

**Response:**
```json
{
  "success": true,
  "message": "Đặt hàng thành công",
  "data": {
    "id": 1,
    "orderNumber": "ORD25122600001",
    "userId": 1,
    "customerName": "Nguyễn Văn A",
    "customerEmail": "customer@example.com",
    "customerPhone": "0901234567",
    "shippingAddress": "123 Đường ABC",
    "shippingCity": "TP. Hồ Chí Minh",
    "paymentMethod": "cod",
    "paymentStatus": "pending",
    "orderStatus": "pending",
    "subtotal": "31980000.00",
    "shippingFee": "30000.00",
    "discount": "0.00",
    "total": "32010000.00",
    "items": [...]
  }
}
```

### 2. Xem danh sách đơn hàng của tôi
```http
GET /api/orders/my?status=pending&page=1&limit=10
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (optional): pending, processing, confirmed, shipping, delivered, cancelled
- `page` (optional): Trang hiện tại (default: 1)
- `limit` (optional): Số đơn mỗi trang (default: 10)

### 3. Xem chi tiết đơn hàng
```http
GET /api/orders/:orderId
Authorization: Bearer {token}
```

### 4. Hủy đơn hàng
```http
PUT /api/orders/:orderId/cancel
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Đổi ý không mua nữa"
}
```

**Lưu ý:** Chỉ có thể hủy đơn ở trạng thái `pending`, `processing`, hoặc `confirmed`

---

## 👨‍💼 Admin - Quản lý đơn hàng

### 1. Xem tất cả đơn hàng (Admin)
```http
GET /api/orders/admin/all?status=&page=1&limit=20&search=
Authorization: Bearer {admin_token}
```

**Query Parameters:**
- `status` (optional): Lọc theo trạng thái
- `page`, `limit`: Phân trang
- `search` (optional): Tìm kiếm theo mã đơn, tên, email, số điện thoại

### 2. Cập nhật trạng thái đơn hàng (Admin)
```http
PUT /api/orders/admin/:orderId/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "orderStatus": "shipping",
  "paymentStatus": "paid"
}
```

**Order Status:**
- `pending` - Chờ xác nhận
- `processing` - Đang xử lý
- `confirmed` - Đã xác nhận
- `shipping` - Đang giao
- `delivered` - Đã giao
- `cancelled` - Đã hủy

**Payment Status:**
- `pending` - Chờ thanh toán
- `paid` - Đã thanh toán
- `failed` - Thanh toán thất bại
- `refunded` - Đã hoàn tiền

### 3. Thống kê đơn hàng (Admin)
```http
GET /api/orders/admin/statistics
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "ordersByStatus": {
      "pending": 10,
      "processing": 5,
      "shipping": 8,
      "delivered": 120,
      "cancelled": 7
    },
    "totalRevenue": "450000000.00"
  }
}
```

---

## 📊 Database Schema

### Cart
```sql
- id (int, primary key)
- userId (int, unique)
- createdAt (datetime)
- updatedAt (datetime)
```

### CartItem
```sql
- id (int, primary key)
- cartId (int)
- productId (int)
- quantity (int)
- price (decimal)
- createdAt (datetime)
- updatedAt (datetime)
```

### Order
```sql
- id (int, primary key)
- orderNumber (string, unique)
- userId (int)
- customerName, customerEmail, customerPhone
- shippingAddress, shippingCity, shippingDistrict, shippingWard
- shippingNote (text)
- paymentMethod, paymentStatus, orderStatus
- subtotal, shippingFee, discount, total (decimal)
- paidAt, shippedAt, deliveredAt, cancelledAt (datetime)
- cancellationReason (text)
- createdAt, updatedAt (datetime)
```

### OrderItem
```sql
- id (int, primary key)
- orderId (int)
- productId (int)
- productName, productImage (snapshot tại thời điểm đặt)
- price, quantity, subtotal (decimal)
- createdAt (datetime)
```

---

## 🔄 Flow đặt hàng

1. **User thêm sản phẩm vào giỏ** → `POST /api/cart`
2. **User xem giỏ hàng** → `GET /api/cart`
3. **User cập nhật số lượng** → `PUT /api/cart/:itemId`
4. **User tạo đơn hàng** → `POST /api/orders`
   - Kiểm tra tồn kho
   - Tạo đơn hàng
   - Trừ số lượng sản phẩm
   - Xóa giỏ hàng
5. **User xem đơn hàng** → `GET /api/orders/my`
6. **Admin cập nhật trạng thái** → `PUT /api/orders/admin/:orderId/status`
7. **User có thể hủy đơn** → `PUT /api/orders/:orderId/cancel`
   - Hoàn lại số lượng tồn kho

---

## ✅ Features

### Cart
- ✅ Tự động tạo giỏ hàng cho user
- ✅ Thêm/xóa/cập nhật sản phẩm
- ✅ Kiểm tra tồn kho
- ✅ Cập nhật giá tự động
- ✅ Tính tổng tiền

### Order
- ✅ Tạo đơn từ giỏ hàng
- ✅ Mã đơn hàng tự động (ORD + ngày + số random)
- ✅ Lưu thông tin khách hàng & địa chỉ
- ✅ Nhiều phương thức thanh toán
- ✅ Tracking trạng thái đơn hàng
- ✅ Snapshot sản phẩm tại thời điểm đặt
- ✅ Quản lý tồn kho (trừ khi đặt, hoàn khi hủy)
- ✅ User hủy đơn (với điều kiện)
- ✅ Admin quản lý & thống kê
- ✅ Phân trang & tìm kiếm

---

## 🚀 Test API

Sử dụng file `test.http` hoặc Postman để test:

```http
### Login
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "123456"
}

### Add to cart
POST http://localhost:5000/api/cart
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "productId": 1,
  "quantity": 2
}

### Create order
POST http://localhost:5000/api/orders
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "customerName": "Test User",
  "customerEmail": "test@example.com",
  "customerPhone": "0901234567",
  "shippingAddress": "123 Test Street",
  "shippingCity": "Ho Chi Minh",
  "paymentMethod": "cod"
}
```
