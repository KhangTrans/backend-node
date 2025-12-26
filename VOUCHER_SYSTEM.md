# Voucher System Documentation

Hệ thống quản lý voucher hỗ trợ 2 loại:
1. **DISCOUNT** - Giảm giá theo phần trăm
2. **FREE_SHIP** - Miễn phí vận chuyển

## Tính năng chính

### 1. Voucher Types

#### DISCOUNT Voucher
- Giảm giá theo phần trăm (1-100%)
- Có thể giới hạn số tiền giảm tối đa (maxDiscount)
- Ví dụ: Giảm 20% tối đa 200k

#### FREE_SHIP Voucher
- Miễn phí vận chuyển
- Phí ship về 0đ khi áp dụng

### 2. Voucher Restrictions

- **Minimum Order Amount**: Giá trị đơn hàng tối thiểu
- **Usage Limit**: Số lần sử dụng tối đa (null = không giới hạn)
- **User Restriction**: Voucher riêng cho user cụ thể (null = public)
- **Time Validity**: Thời gian bắt đầu và kết thúc

### 3. Validation Rules

Khi user áp dụng voucher, hệ thống kiểm tra:
1. Voucher có tồn tại không
2. Voucher có active không
3. Thời gian có hợp lệ không
4. Đã hết lượt sử dụng chưa
5. User có quyền dùng không (nếu là private voucher)
6. Đơn hàng có đạt giá trị tối thiểu không

### 4. Order Integration

Khi tạo đơn hàng với voucher:
1. Validate voucher
2. Apply discount hoặc free ship
3. Lưu voucherId vào order
4. Tăng usedCount của voucher
5. Tính toán lại total price

## Database Schema

```prisma
enum VoucherType {
  DISCOUNT    // Giảm giá theo %
  FREE_SHIP   // Miễn phí ship
}

model Voucher {
  id                Int          @id @default(autoincrement())
  code              String       @unique @db.VarChar(50)
  type              VoucherType
  description       String?      @db.Text
  
  // Discount settings (for DISCOUNT type)
  discountPercent   Int?         // Phần trăm giảm (0-100)
  maxDiscount       Decimal?     @db.Decimal(15, 2) // Giảm tối đa
  
  // Usage limits
  minOrderAmount    Decimal      @default(0) @db.Decimal(15, 2)
  usageLimit        Int?         // null = unlimited
  usedCount         Int          @default(0)
  
  // User restriction
  userId            Int?         // null = public
  user              User?        @relation(...)
  
  // Time validity
  startDate         DateTime
  endDate           DateTime
  
  // Status
  isActive          Boolean      @default(true)
  
  // Relations
  orders            Order[]
}
```

## API Endpoints

### User Endpoints

#### 1. Get Public Vouchers
```
GET /api/vouchers/public
Authorization: Bearer TOKEN
```
Lấy danh sách voucher có thể dùng (public + private của user)

#### 2. Validate Voucher
```
POST /api/vouchers/validate
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "code": "DISCOUNT20",
  "orderAmount": 1000000
}
```
Kiểm tra voucher hợp lệ và tính discount

**Response:**
```json
{
  "success": true,
  "message": "Voucher hợp lệ",
  "data": {
    "voucher": {
      "id": 1,
      "code": "DISCOUNT20",
      "type": "DISCOUNT",
      "description": "Giảm 20% tối đa 200k"
    },
    "discount": 200000,
    "freeShip": false
  }
}
```

### Admin Endpoints

#### 3. Get All Vouchers
```
GET /api/vouchers/admin/all?type=DISCOUNT&isActive=true&page=1&limit=20
Authorization: Bearer ADMIN_TOKEN
```

#### 4. Get Voucher by ID
```
GET /api/vouchers/admin/:voucherId
Authorization: Bearer ADMIN_TOKEN
```

#### 5. Create Voucher
```
POST /api/vouchers/admin
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "code": "DISCOUNT20",
  "type": "DISCOUNT",
  "description": "Giảm 20% tối đa 200k",
  "discountPercent": 20,
  "maxDiscount": 200000,
  "minOrderAmount": 500000,
  "usageLimit": 100,
  "startDate": "2024-12-26T00:00:00.000Z",
  "endDate": "2025-01-31T23:59:59.000Z",
  "isActive": true
}
```

#### 6. Update Voucher
```
PUT /api/vouchers/admin/:voucherId
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "discountPercent": 25,
  "description": "Updated description"
}
```

#### 7. Delete Voucher
```
DELETE /api/vouchers/admin/:voucherId
Authorization: Bearer ADMIN_TOKEN
```
**Note**: Không thể xóa voucher đã được dùng trong đơn hàng

#### 8. Get Voucher Statistics
```
GET /api/vouchers/admin/stats
Authorization: Bearer ADMIN_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 10,
    "active": 7,
    "expired": 3,
    "totalUsage": 145,
    "byType": [
      { "type": "DISCOUNT", "count": 6 },
      { "type": "FREE_SHIP", "count": 4 }
    ]
  }
}
```

## Use Cases

### Case 1: Discount Voucher
```json
{
  "code": "SALE20",
  "type": "DISCOUNT",
  "discountPercent": 20,
  "maxDiscount": 200000,
  "minOrderAmount": 500000
}
```
- Đơn 500k → Giảm 100k (20%)
- Đơn 1M → Giảm 200k (max)
- Đơn 2M → Giảm 200k (max, không vượt quá)

### Case 2: Free Ship Voucher
```json
{
  "code": "FREESHIP",
  "type": "FREE_SHIP",
  "minOrderAmount": 300000
}
```
- Đơn từ 300k trở lên → Free ship (30k)

### Case 3: Private Voucher
```json
{
  "code": "VIP30",
  "type": "DISCOUNT",
  "discountPercent": 30,
  "userId": 2,
  "minOrderAmount": 1000000
}
```
- Chỉ user có id=2 mới dùng được
- User khác dùng → 403 Forbidden

### Case 4: Limited Usage
```json
{
  "code": "FLASH50",
  "type": "DISCOUNT",
  "discountPercent": 50,
  "usageLimit": 10
}
```
- Chỉ 10 người đầu tiên dùng được
- Người thứ 11 → "Voucher đã hết lượt sử dụng"

## Order Creation with Voucher

### Request
```
POST /api/orders
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "customerName": "Nguyễn Văn A",
  "customerEmail": "a@example.com",
  "customerPhone": "0901234567",
  "shippingAddress": "123 Nguyễn Huệ",
  "shippingCity": "TP.HCM",
  "paymentMethod": "cod",
  "voucherCode": "DISCOUNT20"
}
```

### Flow
1. Validate customer info
2. Get cart items
3. Validate voucher (if provided)
4. Calculate: subtotal, shipping, discount, total
5. Create order with voucherId
6. Update voucher usedCount
7. Update product stock
8. Clear cart

### Price Calculation

**Without Voucher:**
```
Subtotal:    1,000,000đ
Shipping:       30,000đ
Discount:            0đ
Total:       1,030,000đ
```

**With DISCOUNT20 (20%, max 200k):**
```
Subtotal:    1,000,000đ
Discount:      200,000đ (20% = 200k, max 200k)
Shipping:       30,000đ
Total:         830,000đ
```

**With FREESHIP:**
```
Subtotal:    1,000,000đ
Discount:            0đ
Shipping:            0đ (free)
Total:       1,000,000đ
```

## Error Handling

### Common Errors

1. **Voucher không tồn tại**
```json
{
  "success": false,
  "message": "Mã voucher không tồn tại"
}
```

2. **Voucher hết hạn**
```json
{
  "success": false,
  "message": "Voucher đã hết hạn hoặc chưa đến thời gian sử dụng"
}
```

3. **Hết lượt sử dụng**
```json
{
  "success": false,
  "message": "Voucher đã hết lượt sử dụng"
}
```

4. **Không đủ điều kiện**
```json
{
  "success": false,
  "message": "Đơn hàng tối thiểu 500,000đ để sử dụng voucher này"
}
```

5. **Private voucher**
```json
{
  "success": false,
  "message": "Voucher này không dành cho bạn"
}
```

6. **Không thể xóa voucher đã dùng**
```json
{
  "success": false,
  "message": "Không thể xóa voucher đã được sử dụng trong 10 đơn hàng. Bạn có thể tắt trạng thái thay vì xóa."
}
```

## Best Practices

### 1. Admin Management
- Tạo voucher với thời gian rõ ràng
- Set usageLimit cho voucher limited edition
- Deactivate thay vì delete voucher đã dùng
- Monitor usage với stats endpoint

### 2. Validation
- Luôn validate voucher trước khi checkout
- Show discount amount cho user preview
- Display voucher requirements (min order, expiry)

### 3. UX Improvements
- List available vouchers ở checkout page
- Auto-apply best voucher (optional)
- Show "Saved XXđ" với voucher
- Display voucher info trong order history

### 4. Security
- Code phải unique và random
- Private voucher chỉ cho user cụ thể
- Validate ownership ở mọi endpoint
- Rate limit cho validate endpoint

## Testing Scenarios

### Scenario 1: Basic Discount Flow
1. Admin tạo voucher DISCOUNT20
2. User validate với orderAmount=1M
3. User checkout với voucherCode
4. Check order có discount 200k
5. Check voucher usedCount tăng lên 1

### Scenario 2: Free Ship Flow
1. Admin tạo FREESHIP voucher
2. User có đơn 500k + ship 30k = 530k
3. Apply FREESHIP
4. Total = 500k (ship = 0)

### Scenario 3: Usage Limit
1. Voucher có usageLimit=2
2. User 1 dùng → success
3. User 2 dùng → success
4. User 3 dùng → fail "hết lượt"

### Scenario 4: Private Voucher
1. Admin tạo VIP30 cho userId=2
2. User id=2 → success
3. User id=3 → fail "không dành cho bạn"

### Scenario 5: Expired Voucher
1. Voucher endDate = yesterday
2. User validate → fail "hết hạn"

## Database Indexes

```prisma
@@index([code])         // Fast lookup by code
@@index([type])         // Filter by type
@@index([userId])       // Private vouchers
@@index([isActive])     // Active vouchers only
```

## Performance Considerations

1. **Cache public vouchers** - TTL 5 phút
2. **Index code field** - Frequent lookups
3. **Batch update usedCount** - Nếu traffic cao
4. **Cleanup expired vouchers** - Cron job monthly

## Future Enhancements

1. **Multiple vouchers per order**
2. **Product-specific vouchers** (only for certain products)
3. **Category vouchers** (only for certain categories)
4. **First order voucher** (chỉ cho đơn đầu tiên)
5. **Loyalty points integration**
6. **Voucher codes generation tool** (bulk create)
7. **Usage history tracking** (who used when)
8. **Auto-apply best voucher** (smart selection)
