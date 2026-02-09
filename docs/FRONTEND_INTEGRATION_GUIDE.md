# 🎨 Frontend Integration Guide - Product Recommendations

## 📋 HƯỚNG DẪN TÍCH HỢP API GỢI Ý SẢN PHẨM CHO FRONTEND

Backend đã hoàn thành **5 API gợi ý sản phẩm thông minh**. Đây là hướng dẫn chi tiết về cách tích hợp và đặt chúng ở đâu để tối ưu UX.

---

## 🎯 VỊ TRÍ ĐẶT CÁC API (UX PLACEMENT)

### 1. **HOMEPAGE** 🏠

#### A. Section "Sản phẩm bán chạy" / "Trending Products"

**API:** `GET /api/recommendations/trending?limit=8`

**Vị trí:**

- Đặt ngay sau banner/hero section
- Hoặc ở giữa trang (middle fold)

**Lý do:**

- Tạo social proof (sản phẩm nhiều người mua)
- Tăng conversion rate
- Giúp người dùng mới biết sản phẩm nào đáng tin cậy

**UI Suggestion:**

```jsx
<section className="trending-products">
  <h2>🔥 Sản phẩm bán chạy</h2>
  <p>Được khách hàng tin dùng nhất trong 30 ngày qua</p>
  <ProductGrid products={trendingProducts} />
</section>
```

---

#### B. Section "Hàng mới về" / "New Arrivals"

**API:** `GET /api/recommendations/new-arrivals?limit=8`

**Vị trí:**

- Sau section "Trending Products"
- Hoặc ở cuối trang trước footer

**Lý do:**

- Giữ website fresh, luôn có nội dung mới
- Khuyến khích người dùng quay lại thường xuyên
- Tạo FOMO (Fear of Missing Out)

**UI Suggestion:**

```jsx
<section className="new-arrivals">
  <h2>✨ Hàng mới về</h2>
  <p>Cập nhật sản phẩm mới nhất trong 30 ngày</p>
  <ProductGrid products={newArrivals} />
</section>
```

---

#### C. Section "Danh mục nổi bật" / "Featured Categories"

**API:** `GET /api/categories/featured`

**Vị trí:**

- Ngay dưới Hero Banner (đầu tiên)
- Dạng tròn (circle) hoặc card nhỏ

**Lý do:**

- Giúp user điều hướng nhanh
- Highlight các nhóm hàng chủ lực

**UI Suggestion:**

```jsx
<section className="featured-categories">
  <h2>Danh mục nổi bật</h2>
  <div className="category-list">
    {categories.map((cat) => (
      <Link to={`/category/${cat.slug}`} className="cat-item">
        <img src={cat.imageUrl} alt={cat.name} />
        <span>{cat.name}</span>
      </Link>
    ))}
  </div>
</section>
```

---

### 2. **PRODUCT DETAIL PAGE** 📦

#### A. Section "Sản phẩm tương tự" / "Similar Products"

**API:** `GET /api/recommendations/similar/:productId?limit=6`

**Vị trí:**

- Ngay dưới thông tin sản phẩm chính
- Hoặc ở tab riêng "Sản phẩm liên quan"

**Lý do:**

- Giúp so sánh giá và tính năng
- Tăng thời gian ở lại trang (dwell time)
- Cross-selling hiệu quả

**UI Suggestion:**

```jsx
<section className="similar-products">
  <h2>Sản phẩm tương tự</h2>
  <p>Cùng phân khúc giá và danh mục</p>
  <ProductCarousel products={similarProducts} />
</section>
```

---

#### B. Section "Khách hàng cũng xem" (Optional - Phase 2)

**Vị trí:**

- Sau section "Similar Products"
- Sticky sidebar (desktop)

---

### 3. **CATEGORY PAGE** 📂

#### A. Section "Sản phẩm nổi bật trong danh mục"

**API:** `GET /api/recommendations/by-category/:categoryId?limit=12`

**Vị trí:**

- Đầu trang category (featured section)
- Hoặc khi filter không có kết quả

**Lý do:**

- Highlight sản phẩm tốt nhất trong category
- Giảm bounce rate khi không tìm thấy sản phẩm

**UI Suggestion:**

```jsx
<section className="category-featured">
  <h2>Nổi bật trong {categoryName}</h2>
  <ProductGrid products={categoryProducts} />
</section>
```

---

### 4. **CART PAGE** 🛒

#### A. Section "Bạn có thể thích" / "You May Also Like"

**API:** `GET /api/recommendations/similar/:productId?limit=4`

**Vị trí:**

- Bên dưới danh sách sản phẩm trong giỏ
- Hoặc sidebar (desktop)

**Lý do:**

- Upselling - tăng giá trị đơn hàng
- Gợi ý phụ kiện đi kèm

**Implementation:**

```jsx
// Lấy 1-2 sản phẩm đầu tiên trong giỏ
const cartItems = getCartItems();
const recommendations = await Promise.all(
  cartItems
    .slice(0, 2)
    .map((item) =>
      fetch(`/api/recommendations/similar/${item.productId}?limit=3`),
    ),
);

// Merge và loại bỏ duplicate
const uniqueRecommendations = removeDuplicates(recommendations.flat());
```

---

### 5. **CHECKOUT SUCCESS PAGE** ✅

#### A. Section "Tiếp tục mua sắm"

**API:** `GET /api/recommendations/trending?limit=6`

**Vị trí:**

- Sau thông tin đơn hàng thành công

**Lý do:**

- Giữ người dùng ở lại website
- Tăng cơ hội mua thêm

---

### 6. **SEARCH RESULTS PAGE** 🔍

#### A. Khi không có kết quả tìm kiếm

**API:** `GET /api/recommendations/trending?limit=8`

**Vị trí:**

- Thay thế cho "No results found"

**Lý do:**

- Giảm bounce rate
- Gợi ý thay thế

**UI Suggestion:**

```jsx
{
  searchResults.length === 0 && (
    <div className="no-results">
      <h3>Không tìm thấy "{searchQuery}"</h3>
      <p>Có thể bạn quan tâm đến những sản phẩm này:</p>
      <ProductGrid products={trendingProducts} />
    </div>
  );
}
```

---

### 7. **USER PROFILE / ACCOUNT PAGE** 👤

#### A. Section "Dành riêng cho bạn" (Phase 2)

**API:** `GET /api/recommendations/for-you` (Coming soon)

**Vị trí:**

- Tab riêng "Gợi ý cho bạn"
- Dashboard overview

---

## 💻 CODE EXAMPLES

### Example 1: Homepage Component (React)

```jsx
import { useEffect, useState } from "react";

const Homepage = () => {
  const [trending, setTrending] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const [trendingRes, newArrivalsRes] = await Promise.all([
          fetch("/api/recommendations/trending?limit=8"),
          fetch("/api/recommendations/new-arrivals?limit=8"),
        ]);

        const trendingData = await trendingRes.json();
        const newArrivalsData = await newArrivalsRes.json();

        if (trendingData.success) {
          setTrending(trendingData.data.products);
        }
        if (newArrivalsData.success) {
          setNewArrivals(newArrivalsData.data.products);
        }
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="homepage">
      {/* Hero Banner */}
      <HeroBanner />

      {/* Trending Products */}
      <section className="trending-section">
        <h2>🔥 Sản phẩm bán chạy</h2>
        <ProductGrid products={trending} />
      </section>

      {/* New Arrivals */}
      <section className="new-arrivals-section">
        <h2>✨ Hàng mới về</h2>
        <ProductGrid products={newArrivals} />
      </section>
    </div>
  );
};
```

---

### Example 2: Product Detail Component (React)

```jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const ProductDetail = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch product details
        const productRes = await fetch(`/api/products/${productId}`);
        const productData = await productRes.json();
        setProduct(productData.data);

        // Fetch similar products
        const similarRes = await fetch(
          `/api/recommendations/similar/${productId}?limit=6`,
        );
        const similarData = await similarRes.json();

        if (similarData.success) {
          setSimilarProducts(similarData.data.products);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchData();
  }, [productId]);

  return (
    <div className="product-detail">
      {/* Product Info */}
      <ProductInfo product={product} />

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <section className="similar-products">
          <h2>Sản phẩm tương tự</h2>
          <ProductCarousel products={similarProducts} />
        </section>
      )}
    </div>
  );
};
```

---

### Example 3: Category Page Component (React)

```jsx
const CategoryPage = () => {
  const { categoryId } = useParams();
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all products in category
        const productsRes = await fetch(
          `/api/products?categoryId=${categoryId}`,
        );
        const productsData = await productsRes.json();
        setProducts(productsData.data);

        // Fetch featured products (newest in category)
        const featuredRes = await fetch(
          `/api/recommendations/by-category/${categoryId}?limit=8`,
        );
        const featuredData = await featuredRes.json();

        if (featuredData.success) {
          setFeaturedProducts(featuredData.data.products);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchData();
  }, [categoryId]);

  return (
    <div className="category-page">
      {/* Featured Section */}
      <section className="featured-section">
        <h2>Nổi bật trong danh mục</h2>
        <ProductGrid products={featuredProducts} />
      </section>

      {/* All Products */}
      <section className="all-products">
        <h2>Tất cả sản phẩm</h2>
        <ProductGrid products={products} />
      </section>
    </div>
  );
};
```

---

### Example 4: Cart Page with Recommendations (React)

```jsx
const CartPage = () => {
  const { cartItems } = useCart();
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (cartItems.length === 0) return;

      try {
        // Get recommendations based on first 2 items in cart
        const promises = cartItems
          .slice(0, 2)
          .map((item) =>
            fetch(
              `/api/recommendations/similar/${item.productId}?limit=3`,
            ).then((res) => res.json()),
          );

        const results = await Promise.all(promises);

        // Merge and remove duplicates
        const allProducts = results
          .filter((r) => r.success)
          .flatMap((r) => r.data.products);

        const uniqueProducts = removeDuplicates(allProducts, "_id");

        // Remove products already in cart
        const filtered = uniqueProducts.filter(
          (p) => !cartItems.some((item) => item.productId === p._id),
        );

        setRecommendations(filtered.slice(0, 4));
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      }
    };

    fetchRecommendations();
  }, [cartItems]);

  return (
    <div className="cart-page">
      {/* Cart Items */}
      <CartItemsList items={cartItems} />

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="cart-recommendations">
          <h3>Bạn có thể thích</h3>
          <ProductGrid products={recommendations} />
        </section>
      )}

      {/* Checkout Button */}
      <CheckoutButton />
    </div>
  );
};

// Helper function
const removeDuplicates = (arr, key) => {
  return arr.filter(
    (item, index, self) =>
      index === self.findIndex((t) => t[key] === item[key]),
  );
};
```

---

## 🎨 UI/UX BEST PRACTICES

### 1. **Loading States**

```jsx
{
  loading ? <SkeletonLoader count={8} /> : <ProductGrid products={products} />;
}
```

### 2. **Empty States**

```jsx
{
  products.length === 0 && (
    <EmptyState message="Chưa có sản phẩm gợi ý" icon="🔍" />
  );
}
```

### 3. **Error Handling**

```jsx
try {
  const res = await fetch("/api/recommendations/trending");
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  setProducts(data.data.products);
} catch (error) {
  console.error(error);
  // Fallback: show manual curated products
  setProducts(fallbackProducts);
}
```

### 4. **Caching (Optional)**

```jsx
// Cache for 5 minutes
const CACHE_TIME = 5 * 60 * 1000;

const getCachedRecommendations = (key) => {
  const cached = localStorage.getItem(key);
  if (!cached) return null;

  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_TIME) {
    localStorage.removeItem(key);
    return null;
  }

  return data;
};
```

---

## 📊 PERFORMANCE TIPS

### 1. **Lazy Loading**

Chỉ load recommendations khi user scroll đến section đó:

```jsx
import { useInView } from "react-intersection-observer";

const RecommendationSection = () => {
  const { ref, inView } = useInView({ triggerOnce: true });
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (inView) {
      fetchRecommendations();
    }
  }, [inView]);

  return <div ref={ref}>...</div>;
};
```

### 2. **Prefetching**

Prefetch recommendations khi hover vào product card:

```jsx
<ProductCard
  onMouseEnter={() => {
    // Prefetch similar products
    fetch(`/api/recommendations/similar/${productId}?limit=6`);
  }}
/>
```

### 3. **Parallel Requests**

Fetch multiple recommendations cùng lúc:

```jsx
const [trending, newArrivals] = await Promise.all([
  fetch("/api/recommendations/trending?limit=8"),
  fetch("/api/recommendations/new-arrivals?limit=8"),
]);
```

---

## 🎯 CONVERSION OPTIMIZATION

### 1. **A/B Testing Positions**

Test xem section nào convert tốt hơn:

- Trending ở đầu vs cuối trang
- Similar products ở dưới vs sidebar

### 2. **Personalization Labels**

Thêm labels để tăng click-through rate:

- "Dành riêng cho bạn" ⭐
- "Được mua cùng" 🛒
- "Xu hướng hiện nay" 🔥

### 3. **Social Proof**

Hiển thị thêm thông tin:

```jsx
<ProductCard>
  <Badge>🔥 Bán chạy</Badge>
  <p>Đã bán {soldCount} sản phẩm</p>
</ProductCard>
```

---

## 📱 RESPONSIVE DESIGN

### Desktop (>1024px)

- Grid: 4-5 sản phẩm/hàng
- Sidebar recommendations

### Tablet (768px - 1024px)

- Grid: 3 sản phẩm/hàng
- Carousel với scroll

### Mobile (<768px)

- Grid: 2 sản phẩm/hàng
- Horizontal scroll carousel
- Lazy load khi scroll

---

## ✅ CHECKLIST TÍCH HỢP

- [ ] Tích hợp API trending vào homepage
- [ ] Tích hợp API new arrivals vào homepage
- [ ] Tích hợp API similar products vào product detail
- [ ] Tích hợp API by-category vào category page
- [ ] Tích hợp recommendations vào cart page
- [ ] Thêm loading states cho tất cả sections
- [ ] Thêm error handling và fallback
- [ ] Test responsive trên mobile/tablet
- [ ] Implement lazy loading
- [ ] Add analytics tracking (optional)

---

## 📞 SUPPORT

Nếu có vấn đề khi tích hợp, liên hệ Backend team!

**API Documentation:** `docs/RECOMMENDATION_API.md`

---

**Created:** 2026-02-09  
**Version:** 1.0.0
