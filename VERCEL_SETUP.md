# 🚀 CẬP NHẬT VERCEL ENVIRONMENT VARIABLES

## ✅ Cloudinary đã hoạt động local!

Bây giờ cần cập nhật Environment Variables trên Vercel để production cũng hoạt động.

## 📝 Các bước thực hiện:

### 1. Vào Vercel Dashboard
1. Truy cập: https://vercel.com/dashboard
2. Chọn project **backend-node**
3. Vào **Settings** → **Environment Variables**

### 2. Cập nhật/Thêm các biến sau:

```
CLOUDINARY_CLOUD_NAME = dsom4uuux
CLOUDINARY_API_KEY = 456735213468847
CLOUDINARY_API_SECRET = 1o0dN-j_hSDrj3AuyFd2Ce8uozI
```

**⚠️ LƯU Ý:**
- Nếu đã có các biến này, click **Edit** và cập nhật giá trị
- Nếu chưa có, click **Add New** và nhập từng biến
- Chọn **Production, Preview, and Development** cho mỗi biến
- Click **Save** sau mỗi biến

### 3. Redeploy
Sau khi lưu xong, Vercel sẽ tự động redeploy hoặc bạn có thể:
- Vào tab **Deployments**
- Click vào deployment mới nhất
- Click **Redeploy**

## 🧪 Test sau khi deploy

### Test upload base64:
```http
POST https://backend-node-lilac-seven.vercel.app/api/upload/base64
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "folder": "products"
}
```

### Test get signature:
```http
GET https://backend-node-lilac-seven.vercel.app/api/upload/signature?folder=products
Authorization: Bearer YOUR_TOKEN
```

## ✅ Kết quả mong đợi

Sau khi cập nhật xong, bạn sẽ thấy response như này:

```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/dsom4uuux/image/upload/v123456/products/abc.jpg",
    "publicId": "products/abc",
    "width": 1,
    "height": 1,
    "format": "png",
    "size": 95
  }
}
```

## 🎯 Tính năng đã hoàn thành

✅ Upload hình ảnh qua base64 (serverless-friendly)
✅ Cập nhật sản phẩm kèm hình ảnh
✅ Xóa hình ảnh từ Cloudinary
✅ Lấy signature cho client-side upload
✅ Hỗ trợ variants khi tạo/cập nhật sản phẩm

## 📚 Tài liệu tham khảo

- [UPLOAD_IMAGES.md](./UPLOAD_IMAGES.md) - Hướng dẫn chi tiết upload hình ảnh
- [test-production.http](./test-production.http) - Ví dụ API calls
