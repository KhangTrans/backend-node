# 🔧 Khắc Phục Lỗi Upload Hình Ảnh - Error 500

## ❌ Lỗi hiện tại
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
Upload image error: Error: Error uploading image
```

## 🔍 Nguyên nhân

Lỗi 500 thường do **Cloudinary chưa được cấu hình trên Vercel Production**.

## ✅ Cách khắc phục

### Bước 1: Kiểm tra config trên Production

Gọi API test (cần token):
```http
GET https://backend-node-lilac-seven.vercel.app/api/upload/test-config
Authorization: Bearer YOUR_TOKEN
```

**Nếu thấy "NOT SET"** → Cloudinary chưa được config trên Vercel.

### Bước 2: Thêm Environment Variables trên Vercel

1. Vào https://vercel.com/dashboard
2. Chọn project **backend-node**
3. **Settings** → **Environment Variables**
4. Thêm 3 biến sau:

```
CLOUDINARY_CLOUD_NAME = dsom4uuux
CLOUDINARY_API_KEY = 456735213468847
CLOUDINARY_API_SECRET = 1o0dN-j_hSDrj3AuyFd2Ce8uozI
```

⚠️ **LƯU Ý:** 
- Chọn **Production, Preview, and Development** cho mỗi biến
- Click **Save** sau mỗi biến

### Bước 3: Redeploy

Sau khi lưu environment variables:
1. Vào tab **Deployments**
2. Click vào deployment mới nhất
3. Click **⋯** (menu) → **Redeploy**
4. Chờ 1-2 phút để Vercel deploy xong

### Bước 4: Test lại

#### Test Config
```http
GET https://backend-node-lilac-seven.vercel.app/api/upload/test-config
Authorization: Bearer YOUR_TOKEN
```

**Response mong đợi:**
```json
{
  "success": true,
  "message": "Cloudinary is configured",
  "config": {
    "cloudName": "dsom4uuux",
    "apiKey": "456735213468847",
    "apiSecret": "***uozI"
  }
}
```

#### Test Upload
```http
POST https://backend-node-lilac-seven.vercel.app/api/upload/base64
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "folder": "products"
}
```

**Response mong đợi:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/dsom4uuux/image/upload/v123/products/abc.png",
    "publicId": "products/abc",
    "width": 1,
    "height": 1,
    "format": "png",
    "size": 95
  }
}
```

## 🐛 Các lỗi khác có thể gặp

### Lỗi: "Invalid image format"
**Nguyên nhân:** Image không phải base64 hoặc không bắt đầu bằng `data:image/`

**Giải pháp:** 
```javascript
// Đảm bảo format đúng
const base64 = `data:image/jpeg;base64,${imageData}`;
```

### Lỗi: "Image too large"
**Nguyên nhân:** File > 10MB

**Giải pháp:** Nén ảnh trước khi upload:
```bash
npm install browser-image-compression
```

```javascript
import imageCompression from 'browser-image-compression';

const options = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920
};

const compressedFile = await imageCompression(file, options);
```

### Lỗi: "No authorization token"
**Nguyên nhân:** Chưa login hoặc token hết hạn

**Giải pháp:** 
1. Login lại để lấy token mới
2. Thêm header: `Authorization: Bearer YOUR_TOKEN`

## 📊 Debug Checklist

- [ ] Cloudinary environment variables đã được set trên Vercel
- [ ] Đã redeploy sau khi thêm env vars
- [ ] API test-config trả về success: true
- [ ] Token authorization còn hiệu lực
- [ ] Image base64 format đúng (bắt đầu với `data:image/`)
- [ ] Image size < 10MB

## 🎯 Test nhanh với cURL

```bash
# 1. Get your token first (login)
curl -X POST https://backend-node-lilac-seven.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# 2. Test config (replace YOUR_TOKEN)
curl https://backend-node-lilac-seven.vercel.app/api/upload/test-config \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Test upload (replace YOUR_TOKEN)
curl -X POST https://backend-node-lilac-seven.vercel.app/api/upload/base64 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==","folder":"products"}'
```

## 📞 Vẫn lỗi?

Nếu vẫn gặp lỗi sau khi làm các bước trên:
1. Check Vercel deployment logs: **Deployments** → Click vào deployment → **View Function Logs**
2. Tìm error message chi tiết
3. Verify lại Cloudinary credentials tại https://console.cloudinary.com/settings
