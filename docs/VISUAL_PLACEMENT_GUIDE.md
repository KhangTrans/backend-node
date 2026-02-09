# 🎨 Visual Placement Guide - Product Recommendations

## HƯỚNG DẪN TRỰC QUAN VỊ TRÍ ĐẶT GỢI Ý SẢN PHẨM

---

## 📱 HOMEPAGE LAYOUT

```
┌─────────────────────────────────────────────────────┐
│                   HEADER / NAVBAR                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│              🎯 HERO BANNER / SLIDER                 │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  🔥 SẢN PHẨM BÁN CHẠY (Trending Products)           │
│  API: /api/recommendations/trending?limit=8         │
│                                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│  │ SP 1 │ │ SP 2 │ │ SP 3 │ │ SP 4 │               │
│  └──────┘ └──────┘ └──────┘ └──────┘               │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│  │ SP 5 │ │ SP 6 │ │ SP 7 │ │ SP 8 │               │
│  └──────┘ └──────┘ └──────┘ └──────┘               │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ✨ HÀNG MỚI VỀ (New Arrivals)                      │
│  API: /api/recommendations/new-arrivals?limit=8     │
│                                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│  │ SP 1 │ │ SP 2 │ │ SP 3 │ │ SP 4 │               │
│  └──────┘ └──────┘ └──────┘ └──────┘               │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│  │ SP 5 │ │ SP 6 │ │ SP 7 │ │ SP 8 │               │
│  └──────┘ └──────┘ └──────┘ └──────┘               │
│                                                      │
├─────────────────────────────────────────────────────┤
│                     FOOTER                           │
└─────────────────────────────────────────────────────┘
```

**Priority:** ⭐⭐⭐⭐⭐ (Cao nhất)  
**Impact:** Tăng 30-40% engagement trên homepage

---

## 📦 PRODUCT DETAIL PAGE LAYOUT

```
┌─────────────────────────────────────────────────────┐
│                   HEADER / NAVBAR                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐  ┌─────────────────────────────┐ │
│  │              │  │  Tên sản phẩm                │ │
│  │   Hình ảnh   │  │  Giá: 1.000.000đ             │ │
│  │   Sản phẩm   │  │  ⭐⭐⭐⭐⭐ (50 reviews)      │ │
│  │              │  │                              │ │
│  └──────────────┘  │  [Thêm vào giỏ]  [Mua ngay] │ │
│                    └─────────────────────────────┘ │
│                                                      │
├─────────────────────────────────────────────────────┤
│  📝 MÔ TẢ SẢN PHẨM                                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  🔍 SẢN PHẨM TƯƠNG TỰ (Similar Products)            │
│  API: /api/recommendations/similar/:id?limit=6      │
│                                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│  │ SP 1 │ │ SP 2 │ │ SP 3 │ │ SP 4 │ │ SP 5 │     │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘     │
│                                                      │
│  "Cùng phân khúc giá và danh mục"                   │
│                                                      │
├─────────────────────────────────────────────────────┤
│  💬 ĐÁNH GIÁ KHÁCH HÀNG                             │
└─────────────────────────────────────────────────────┘
```

**Priority:** ⭐⭐⭐⭐⭐ (Cao nhất)  
**Impact:** Tăng 25-35% cross-selling, giảm bounce rate

---

## 📂 CATEGORY PAGE LAYOUT

```
┌─────────────────────────────────────────────────────┐
│                   HEADER / NAVBAR                    │
├─────────────────────────────────────────────────────┤
│  📂 DANH MỤC: Điện thoại                            │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ⭐ NỔI BẬT TRONG DANH MỤC                          │
│  API: /api/recommendations/by-category/:id?limit=8  │
│                                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│  │ SP 1 │ │ SP 2 │ │ SP 3 │ │ SP 4 │               │
│  └──────┘ └──────┘ └──────┘ └──────┘               │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  🔧 BỘ LỌC                                          │
│  ┌─────────────┐                                    │
│  │ Giá         │                                    │
│  │ Thương hiệu │                                    │
│  │ Đánh giá    │                                    │
│  └─────────────┘                                    │
│                                                      │
│  📦 TẤT CẢ SẢN PHẨM                                 │
│                                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│  │ SP 1 │ │ SP 2 │ │ SP 3 │ │ SP 4 │               │
│  └──────┘ └──────┘ └──────┘ └──────┘               │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│  │ SP 5 │ │ SP 6 │ │ SP 7 │ │ SP 8 │               │
│  └──────┘ └──────┘ └──────┘ └──────┘               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Priority:** ⭐⭐⭐⭐ (Cao)  
**Impact:** Highlight sản phẩm tốt nhất, tăng conversion

---

## 🛒 CART PAGE LAYOUT

```
┌─────────────────────────────────────────────────────┐
│                   HEADER / NAVBAR                    │
├─────────────────────────────────────────────────────┤
│  🛒 GIỎ HÀNG CỦA BẠN                                │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ 📱 iPhone 15 Pro      1.000.000đ   [x] [+] [-] │ │
│  │ 💻 MacBook Pro        2.000.000đ   [x] [+] [-] │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Tổng: 3.000.000đ                                   │
│  [Tiếp tục mua sắm]  [Thanh toán]                   │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  💡 BẠN CÓ THỂ THÍCH (You May Also Like)            │
│  API: /api/recommendations/similar/:id?limit=4      │
│  (Based on cart items)                              │
│                                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│  │ SP 1 │ │ SP 2 │ │ SP 3 │ │ SP 4 │               │
│  └──────┘ └──────┘ └──────┘ └──────┘               │
│                                                      │
│  "Phụ kiện và sản phẩm liên quan"                   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Priority:** ⭐⭐⭐⭐ (Cao)  
**Impact:** Tăng 15-20% average order value (AOV)

---

## 🔍 SEARCH RESULTS PAGE (No Results)

```
┌─────────────────────────────────────────────────────┐
│                   HEADER / NAVBAR                    │
├─────────────────────────────────────────────────────┤
│  🔍 Tìm kiếm: "iPhone 20"                           │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ❌ Không tìm thấy kết quả cho "iPhone 20"          │
│                                                      │
│  💡 GỢI Ý CHO BẠN                                   │
│  API: /api/recommendations/trending?limit=8         │
│                                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│  │ SP 1 │ │ SP 2 │ │ SP 3 │ │ SP 4 │               │
│  └──────┘ └──────┘ └──────┘ └──────┘               │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│  │ SP 5 │ │ SP 6 │ │ SP 7 │ │ SP 8 │               │
│  └──────┘ └──────┘ └──────┘ └──────┘               │
│                                                      │
│  "Sản phẩm bán chạy nhất hiện nay"                  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Priority:** ⭐⭐⭐ (Trung bình)  
**Impact:** Giảm 40-50% bounce rate khi không có kết quả

---

## ✅ CHECKOUT SUCCESS PAGE

```
┌─────────────────────────────────────────────────────┐
│                   HEADER / NAVBAR                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ✅ ĐẶT HÀNG THÀNH CÔNG!                            │
│                                                      │
│  📦 Mã đơn hàng: #12345                             │
│  💰 Tổng tiền: 3.000.000đ                           │
│  🚚 Giao hàng dự kiến: 3-5 ngày                     │
│                                                      │
│  [Xem đơn hàng]  [Tiếp tục mua sắm]                 │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  🛍️ TIẾP TỤC MUA SẮM                                │
│  API: /api/recommendations/trending?limit=6         │
│                                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│  │ SP 1 │ │ SP 2 │ │ SP 3 │ │ SP 4 │               │
│  └──────┘ └──────┘ └──────┘ └──────┘               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Priority:** ⭐⭐⭐ (Trung bình)  
**Impact:** Tăng repeat purchase rate

---

## 📊 PRIORITY MATRIX

| Trang                   | API                     | Priority   | Expected Impact |
| ----------------------- | ----------------------- | ---------- | --------------- |
| **Homepage**            | Trending + New Arrivals | ⭐⭐⭐⭐⭐ | Engagement +35% |
| **Product Detail**      | Similar Products        | ⭐⭐⭐⭐⭐ | Cross-sell +30% |
| **Cart**                | Similar (based on cart) | ⭐⭐⭐⭐   | AOV +20%        |
| **Category**            | By Category             | ⭐⭐⭐⭐   | Conversion +15% |
| **Search (No Results)** | Trending                | ⭐⭐⭐     | Bounce -40%     |
| **Checkout Success**    | Trending                | ⭐⭐⭐     | Repeat +10%     |

---

## 🎯 IMPLEMENTATION ROADMAP

### Phase 1: Must-Have (Week 1)

- ✅ Homepage: Trending Products
- ✅ Homepage: New Arrivals
- ✅ Product Detail: Similar Products

### Phase 2: Should-Have (Week 2)

- ✅ Category Page: Featured Products
- ✅ Cart Page: Recommendations

### Phase 3: Nice-to-Have (Week 3)

- ✅ Search: No Results Fallback
- ✅ Checkout Success: Continue Shopping

---

## 💡 DESIGN TIPS

### 1. Section Headers

```
🔥 Sản phẩm bán chạy
✨ Hàng mới về
🔍 Sản phẩm tương tự
💡 Bạn có thể thích
⭐ Nổi bật trong danh mục
```

### 2. Badges & Labels

```jsx
<Badge color="red">🔥 Hot</Badge>
<Badge color="green">✨ New</Badge>
<Badge color="blue">💎 Trending</Badge>
```

### 3. Loading Skeletons

```
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ ▓▓▓▓ │ │ ▓▓▓▓ │ │ ▓▓▓▓ │ │ ▓▓▓▓ │
│ ▓▓▓▓ │ │ ▓▓▓▓ │ │ ▓▓▓▓ │ │ ▓▓▓▓ │
└──────┘ └──────┘ └──────┘ └──────┘
```

---

## 📱 RESPONSIVE BREAKPOINTS

### Desktop (>1200px)

- Grid: 4-5 products per row
- Show all sections

### Tablet (768px - 1200px)

- Grid: 3 products per row
- Carousel with arrows

### Mobile (<768px)

- Grid: 2 products per row
- Horizontal scroll
- Reduce limit to 4-6 products

---

**Created:** 2026-02-09  
**Version:** 1.0.0
