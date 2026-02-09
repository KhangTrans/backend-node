# 🎯 Product Recommendation API Documentation

## Overview

Hệ thống gợi ý sản phẩm thông minh giúp tăng trải nghiệm người dùng và doanh số bán hàng.

---

## 📋 API Endpoints

### 1. **Similar Products** - Sản phẩm tương tự

Gợi ý sản phẩm tương tự dựa trên danh mục và khoảng giá (±30%).

**Endpoint:**

```
GET /api/recommendations/similar/:productId
```

**Parameters:**

- `productId` (path, required): ID của sản phẩm gốc
- `limit` (query, optional): Số lượng sản phẩm trả về (default: 10, max: 50)

**Example Request:**

```bash
GET /api/recommendations/similar/695cfd0114b15417e45ded27?limit=5
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "type": "similar",
    "total": 3,
    "products": [
      {
        "_id": "695cfd0114b15417e45ded28",
        "name": "iPhone 15 Pro",
        "slug": "iphone-15-pro",
        "price": 29990000,
        "stock": 50,
        "images": [...],
        "categoryId": "695cfd0114b15417e45ded20",
        "createdAt": "2026-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

---

### 2. **Trending Products** - Sản phẩm bán chạy

Gợi ý sản phẩm được mua nhiều nhất trong khoảng thời gian gần đây.

**Endpoint:**

```
GET /api/recommendations/trending
```

**Parameters:**

- `limit` (query, optional): Số lượng sản phẩm (default: 10, max: 50)
- `days` (query, optional): Số ngày nhìn lại (default: 30, max: 365)

**Example Request:**

```bash
GET /api/recommendations/trending?limit=10&days=30
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "type": "trending",
    "period": "30 days",
    "total": 5,
    "products": [...]
  }
}
```

**Logic:**

- Tính toán dựa trên số lượng đơn hàng có status: `confirmed`, `shipping`, `delivered`
- Sắp xếp theo tổng số lượng bán được
- Nếu không có đơn hàng, fallback về sản phẩm mới nhất

---

### 3. **New Arrivals** - Sản phẩm mới

Gợi ý sản phẩm mới được thêm vào hệ thống.

**Endpoint:**

```
GET /api/recommendations/new-arrivals
```

**Parameters:**

- `limit` (query, optional): Số lượng sản phẩm (default: 10, max: 50)
- `days` (query, optional): Số ngày coi là "mới" (default: 30, max: 365)

**Example Request:**

```bash
GET /api/recommendations/new-arrivals?limit=10&days=30
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "type": "new_arrivals",
    "period": "30 days",
    "total": 5,
    "products": [...]
  }
}
```

---

### 4. **Products by Category** - Sản phẩm cùng danh mục

Gợi ý sản phẩm trong cùng danh mục.

**Endpoint:**

```
GET /api/recommendations/by-category/:categoryId
```

**Parameters:**

- `categoryId` (path, required): ID của danh mục
- `limit` (query, optional): Số lượng sản phẩm (default: 10, max: 50)
- `exclude` (query, optional): ID sản phẩm cần loại trừ

**Example Request:**

```bash
GET /api/recommendations/by-category/695cfd0114b15417e45ded20?limit=10&exclude=695cfd0114b15417e45ded27
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "type": "category_based",
    "categoryId": "695cfd0114b15417e45ded20",
    "total": 8,
    "products": [...]
  }
}
```

---

### 5. **Best Rated Products** - Sản phẩm được đánh giá cao

Gợi ý sản phẩm có rating cao nhất.

**Endpoint:**

```
GET /api/recommendations/best-rated
```

**Parameters:**

- `limit` (query, optional): Số lượng sản phẩm (default: 10, max: 50)

**Example Request:**

```bash
GET /api/recommendations/best-rated?limit=10
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "type": "best_rated",
    "total": 10,
    "products": [...]
  }
}
```

**Note:** Hiện tại đang fallback về trending products. Sẽ được cập nhật khi có review aggregation.

---

## 🎨 Use Cases cho Frontend

### 1. **Product Detail Page**

```javascript
// Hiển thị sản phẩm tương tự
const similarProducts = await fetch(
  `/api/recommendations/similar/${productId}?limit=6`,
);
```

### 2. **Homepage**

```javascript
// Hiển thị sản phẩm trending
const trending = await fetch("/api/recommendations/trending?limit=8");

// Hiển thị sản phẩm mới
const newArrivals = await fetch("/api/recommendations/new-arrivals?limit=8");
```

### 3. **Category Page**

```javascript
// Hiển thị sản phẩm cùng danh mục
const categoryProducts = await fetch(
  `/api/recommendations/by-category/${categoryId}?limit=12`,
);
```

### 4. **Cart/Checkout Page**

```javascript
// "Bạn có thể thích" - dựa trên sản phẩm trong giỏ
const cartItems = getCartItems();
const recommendations = await Promise.all(
  cartItems
    .slice(0, 2)
    .map((item) =>
      fetch(`/api/recommendations/similar/${item.productId}?limit=3`),
    ),
);
```

---

## 🔧 Technical Details

### Filtering Rules

Tất cả API đều tự động lọc:

- ✅ `isActive: true` - Chỉ sản phẩm đang active
- ✅ `stock > 0` - Chỉ sản phẩm còn hàng

### Performance

- Sử dụng MongoDB indexes để tối ưu query
- Limit tối đa 50 sản phẩm để tránh overload
- Caching có thể được thêm vào sau

### Error Handling

- `400 Bad Request`: ID không hợp lệ
- `500 Internal Server Error`: Lỗi server

---

## 🚀 Future Enhancements (Phase 2)

### 1. **Personalized Recommendations**

```
GET /api/recommendations/for-you
```

Dựa trên:

- Lịch sử mua hàng
- Lịch sử xem sản phẩm
- Sản phẩm đã review

### 2. **Bought Together**

```
GET /api/recommendations/bought-together/:productId
```

"Người mua sản phẩm này cũng mua..."

### 3. **User Activity Tracking**

Track user behavior để cải thiện recommendations:

- Product views
- Add to cart
- Wishlist
- Search queries

---

## 📊 Testing

Run test script:

```bash
node scripts/test-recommendations.js
```

---

## 📝 Notes

- Tất cả endpoints đều **public** (không cần authentication)
- Response format nhất quán với các API khác
- Có thể thêm caching layer (Redis) để tăng performance
- Frontend có thể cache kết quả trong 5-10 phút

---

**Created:** 2026-02-09  
**Version:** 1.0.0 (Phase 1)
