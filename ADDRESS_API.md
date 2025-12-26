# Customer Address Management API

API quản lý địa chỉ khách hàng - cho phép mỗi khách hàng lưu nhiều địa chỉ giao hàng với 1 địa chỉ mặc định.

## Base URL
```
http://localhost:5000/api/addresses
```

## Authentication
Tất cả các API yêu cầu JWT token trong header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 1. Get All Addresses
Lấy danh sách địa chỉ của người dùng hiện tại.

**Endpoint:** `GET /api/addresses`

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 2,
      "fullName": "Nguyễn Văn A",
      "phoneNumber": "0901234567",
      "address": "123 Nguyễn Huệ",
      "city": "TP. Hồ Chí Minh",
      "district": "Quận 1",
      "ward": "Phường Bến Nghé",
      "isDefault": true,
      "label": "Nhà riêng",
      "createdAt": "2024-12-26T03:00:00.000Z",
      "updatedAt": "2024-12-26T03:00:00.000Z"
    },
    {
      "id": 2,
      "userId": 2,
      "fullName": "Nguyễn Văn A",
      "phoneNumber": "0901234567",
      "address": "456 Lê Lợi",
      "city": "TP. Hồ Chí Minh",
      "district": "Quận 3",
      "ward": "Phường 5",
      "isDefault": false,
      "label": "Văn phòng",
      "createdAt": "2024-12-26T04:00:00.000Z",
      "updatedAt": "2024-12-26T04:00:00.000Z"
    }
  ]
}
```

**Notes:**
- Địa chỉ mặc định (isDefault: true) sẽ hiển thị đầu tiên
- Sắp xếp theo thứ tự: địa chỉ mặc định → mới nhất

---

## 2. Get Default Address
Lấy địa chỉ mặc định của người dùng.

**Endpoint:** `GET /api/addresses/default`

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 2,
    "fullName": "Nguyễn Văn A",
    "phoneNumber": "0901234567",
    "address": "123 Nguyễn Huệ",
    "city": "TP. Hồ Chí Minh",
    "district": "Quận 1",
    "ward": "Phường Bến Nghé",
    "isDefault": true,
    "label": "Nhà riêng",
    "createdAt": "2024-12-26T03:00:00.000Z",
    "updatedAt": "2024-12-26T03:00:00.000Z"
  }
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "Chưa có địa chỉ mặc định"
}
```

---

## 3. Get Address by ID
Lấy thông tin chi tiết 1 địa chỉ.

**Endpoint:** `GET /api/addresses/:addressId`

**Parameters:**
- `addressId` (path): ID của địa chỉ

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 2,
    "fullName": "Nguyễn Văn A",
    "phoneNumber": "0901234567",
    "address": "123 Nguyễn Huệ",
    "city": "TP. Hồ Chí Minh",
    "district": "Quận 1",
    "ward": "Phường Bến Nghé",
    "isDefault": true,
    "label": "Nhà riêng",
    "createdAt": "2024-12-26T03:00:00.000Z",
    "updatedAt": "2024-12-26T03:00:00.000Z"
  }
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "Không tìm thấy địa chỉ"
}
```

**Response Error (403):**
```json
{
  "success": false,
  "message": "Không có quyền truy cập địa chỉ này"
}
```

---

## 4. Create Address
Tạo địa chỉ mới.

**Endpoint:** `POST /api/addresses`

**Request Body:**
```json
{
  "fullName": "Nguyễn Văn A",
  "phoneNumber": "0901234567",
  "address": "123 Nguyễn Huệ",
  "city": "TP. Hồ Chí Minh",
  "district": "Quận 1",
  "ward": "Phường Bến Nghé",
  "isDefault": false,
  "label": "Nhà riêng"
}
```

**Required Fields:**
- `fullName`: Họ tên người nhận (bắt buộc)
- `phoneNumber`: Số điện thoại (bắt buộc)
- `address`: Địa chỉ chi tiết (bắt buộc)
- `city`: Tỉnh/Thành phố (bắt buộc)

**Optional Fields:**
- `district`: Quận/Huyện
- `ward`: Phường/Xã
- `isDefault`: Đặt làm địa chỉ mặc định (mặc định: false)
- `label`: Nhãn (Nhà riêng, Văn phòng, ...)

**Response Success (201):**
```json
{
  "success": true,
  "message": "Đã thêm địa chỉ mới",
  "data": {
    "id": 3,
    "userId": 2,
    "fullName": "Nguyễn Văn A",
    "phoneNumber": "0901234567",
    "address": "123 Nguyễn Huệ",
    "city": "TP. Hồ Chí Minh",
    "district": "Quận 1",
    "ward": "Phường Bến Nghé",
    "isDefault": false,
    "label": "Nhà riêng",
    "createdAt": "2024-12-26T05:00:00.000Z",
    "updatedAt": "2024-12-26T05:00:00.000Z"
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Vui lòng điền đầy đủ thông tin bắt buộc"
}
```

**Notes:**
- Nếu `isDefault = true`, các địa chỉ khác sẽ tự động bỏ default
- Nếu đây là địa chỉ đầu tiên, sẽ tự động đặt làm mặc định
- Khi tạo địa chỉ mới với `isDefault = true`, địa chỉ cũ sẽ tự động bỏ default

---

## 5. Update Address
Cập nhật thông tin địa chỉ.

**Endpoint:** `PUT /api/addresses/:addressId`

**Parameters:**
- `addressId` (path): ID của địa chỉ cần cập nhật

**Request Body:** (Chỉ cần gửi các field muốn cập nhật)
```json
{
  "fullName": "Nguyễn Văn B",
  "phoneNumber": "0907654321",
  "address": "789 Lê Văn Sỹ",
  "city": "TP. Hồ Chí Minh",
  "district": "Quận 3",
  "ward": "Phường 14",
  "isDefault": true,
  "label": "Văn phòng mới"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Đã cập nhật địa chỉ",
  "data": {
    "id": 2,
    "userId": 2,
    "fullName": "Nguyễn Văn B",
    "phoneNumber": "0907654321",
    "address": "789 Lê Văn Sỹ",
    "city": "TP. Hồ Chí Minh",
    "district": "Quận 3",
    "ward": "Phường 14",
    "isDefault": true,
    "label": "Văn phòng mới",
    "createdAt": "2024-12-26T04:00:00.000Z",
    "updatedAt": "2024-12-26T05:30:00.000Z"
  }
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "Không tìm thấy địa chỉ"
}
```

**Response Error (403):**
```json
{
  "success": false,
  "message": "Không có quyền chỉnh sửa địa chỉ này"
}
```

**Notes:**
- Nếu cập nhật `isDefault = true`, các địa chỉ khác sẽ tự động bỏ default
- Chỉ owner của địa chỉ mới có quyền cập nhật

---

## 6. Set Default Address
Đặt 1 địa chỉ làm mặc định.

**Endpoint:** `PUT /api/addresses/:addressId/set-default`

**Parameters:**
- `addressId` (path): ID của địa chỉ muốn đặt làm mặc định

**Response Success (200):**
```json
{
  "success": true,
  "message": "Đã đặt làm địa chỉ mặc định",
  "data": {
    "id": 2,
    "userId": 2,
    "fullName": "Nguyễn Văn A",
    "phoneNumber": "0901234567",
    "address": "456 Lê Lợi",
    "city": "TP. Hồ Chí Minh",
    "district": "Quận 3",
    "ward": "Phường 5",
    "isDefault": true,
    "label": "Văn phòng",
    "createdAt": "2024-12-26T04:00:00.000Z",
    "updatedAt": "2024-12-26T06:00:00.000Z"
  }
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "Không tìm thấy địa chỉ"
}
```

**Response Error (403):**
```json
{
  "success": false,
  "message": "Không có quyền truy cập địa chỉ này"
}
```

**Notes:**
- Chỉ có thể có 1 địa chỉ mặc định tại 1 thời điểm
- Địa chỉ cũ sẽ tự động bỏ default khi đặt địa chỉ mới làm default

---

## 7. Delete Address
Xóa địa chỉ.

**Endpoint:** `DELETE /api/addresses/:addressId`

**Parameters:**
- `addressId` (path): ID của địa chỉ cần xóa

**Response Success (200):**
```json
{
  "success": true,
  "message": "Đã xóa địa chỉ"
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "Không tìm thấy địa chỉ"
}
```

**Response Error (403):**
```json
{
  "success": false,
  "message": "Không có quyền xóa địa chỉ này"
}
```

**Notes:**
- Nếu xóa địa chỉ mặc định, địa chỉ cũ nhất còn lại sẽ tự động trở thành mặc định
- Người dùng chỉ có thể xóa địa chỉ của chính mình

---

## Common Error Responses

### 401 Unauthorized
Chưa đăng nhập hoặc token không hợp lệ:
```json
{
  "success": false,
  "message": "No token provided" 
}
```
hoặc
```json
{
  "success": false,
  "message": "Invalid token"
}
```

### 500 Internal Server Error
Lỗi server:
```json
{
  "success": false,
  "message": "Lỗi khi ...",
  "error": "Error details"
}
```

---

## Usage Flow

### Kịch bản 1: Người dùng thêm địa chỉ đầu tiên
1. POST /api/addresses (với isDefault = false)
2. Hệ thống tự động đặt làm default vì đây là địa chỉ đầu tiên

### Kịch bản 2: Người dùng thêm địa chỉ thứ 2
1. POST /api/addresses (với isDefault = false)
2. Địa chỉ mới được tạo nhưng không phải default
3. Người dùng muốn đổi default: PUT /api/addresses/2/set-default

### Kịch bản 3: Xóa địa chỉ mặc định
1. DELETE /api/addresses/1 (địa chỉ mặc định)
2. Hệ thống tự động chọn địa chỉ cũ nhất còn lại làm mặc định

### Kịch bản 4: Checkout (trong order controller)
1. GET /api/addresses/default để lấy địa chỉ mặc định
2. Hoặc GET /api/addresses để cho user chọn địa chỉ khác
3. Tạo đơn hàng với địa chỉ đã chọn

---

## Testing với REST Client

Xem file `test-addresses.http` để test các API này.

---

## Database Schema

```prisma
model CustomerAddress {
  id          Int      @id @default(autoincrement())
  userId      Int
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  fullName    String   @db.VarChar(100)
  phoneNumber String   @db.VarChar(20)
  address     String   @db.VarChar(500)
  city        String   @db.VarChar(100)
  district    String?  @db.VarChar(100)
  ward        String?  @db.VarChar(100)
  
  isDefault   Boolean  @default(false)
  label       String?  @db.VarChar(50) // Nhà riêng, Văn phòng, ...
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([userId, isDefault])
  @@map("customer_addresses")
}
```

**Quan hệ:**
- Một User có thể có nhiều CustomerAddress (1-n)
- Khi xóa User, tất cả địa chỉ của user đó cũng bị xóa (onDelete: Cascade)

---

## Best Practices

1. **Địa chỉ mặc định:**
   - Luôn đảm bảo có 1 địa chỉ mặc định (nếu user có địa chỉ)
   - Không cho phép user bỏ default mà không chọn default mới

2. **Validation:**
   - Validate số điện thoại format (ở frontend)
   - Giới hạn số lượng địa chỉ mỗi user (tùy chọn, có thể implement sau)

3. **UX:**
   - Hiển thị địa chỉ mặc định đầu tiên trong danh sách
   - Cho phép chọn nhanh địa chỉ mặc định khi checkout
   - Icon/badge để phân biệt địa chỉ mặc định

4. **Security:**
   - User chỉ xem/sửa/xóa địa chỉ của chính mình
   - Kiểm tra ownership ở mọi endpoint

---

## Integration với Order System

Khi tạo đơn hàng, có thể:
1. Tự động lấy địa chỉ mặc định
2. Cho phép user chọn địa chỉ khác
3. Cho phép user nhập địa chỉ mới (tùy chọn lưu vào danh sách)

```javascript
// Example: Lấy địa chỉ mặc định cho checkout
const defaultAddress = await prisma.customerAddress.findFirst({
  where: {
    userId: req.user.id,
    isDefault: true
  }
});

// Sử dụng thông tin từ defaultAddress để tạo order
const order = await prisma.order.create({
  data: {
    // ...
    shippingFullName: defaultAddress.fullName,
    shippingPhoneNumber: defaultAddress.phoneNumber,
    shippingAddress: defaultAddress.address,
    shippingCity: defaultAddress.city,
    shippingDistrict: defaultAddress.district,
    shippingWard: defaultAddress.ward
  }
});
```
