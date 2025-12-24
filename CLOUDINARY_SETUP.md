# 📸 Cloudinary Setup Guide

## 🔑 Lấy API Credentials

### Bước 1: Đăng nhập Cloudinary
1. Truy cập: https://cloudinary.com/console
2. Đăng nhập vào tài khoản của bạn

### Bước 2: Lấy thông tin API
Trong Dashboard, bạn sẽ thấy:
```
Cloud Name: dsom4uuux (hoặc cloud name của bạn)
API Key: 123456789012345
API Secret: abcdefghijklmnopqrstuvwxyz123
```

### Bước 3: Cấu hình .env
Thêm vào file `.env`:
```env
CLOUDINARY_CLOUD_NAME=dsom4uuux
CLOUDINARY_API_KEY=your-api-key-here
CLOUDINARY_API_SECRET=your-api-secret-here
```

### Bước 4: Cấu hình Vercel Environment Variables
1. Vào Vercel Dashboard: https://vercel.com/dashboard
2. Chọn project `backend-node`
3. Settings → Environment Variables
4. Thêm 3 biến:
   - `CLOUDINARY_CLOUD_NAME` = dsom4uuux
   - `CLOUDINARY_API_KEY` = your-api-key
   - `CLOUDINARY_API_SECRET` = your-api-secret

## 🚀 Cách sử dụng

### Upload 1 ảnh
```bash
POST /api/upload/image
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body: FormData with "image" field
```

### Upload nhiều ảnh
```bash
POST /api/upload/images
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body: FormData with "images" field (array)
```

### Response mẫu
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/dsom4uuux/image/upload/v1234567890/products/abc123.jpg",
    "publicId": "products/abc123",
    "width": 1000,
    "height": 1000,
    "format": "jpg",
    "size": 245678
  }
}
```

## 📝 Test với Postman

### 1. Upload ảnh
- Method: POST
- URL: `{{baseUrl}}/api/upload/image`
- Headers: `Authorization: Bearer {{token}}`
- Body → form-data:
  - Key: `image` (type: File)
  - Value: Chọn file ảnh

### 2. Tạo sản phẩm với ảnh đã upload
```json
POST /api/products
{
  "name": "iPhone 15",
  "price": 29990000,
  "categoryId": 1,
  "images": [
    {
      "imageUrl": "https://res.cloudinary.com/dsom4uuux/...",
      "isPrimary": true,
      "order": 0
    }
  ]
}
```

## ✨ Tính năng

✅ Auto resize: Max 1000x1000px
✅ Auto quality optimization
✅ Hỗ trợ: JPG, PNG, GIF, WebP
✅ Max file size: 5MB
✅ Folder organization: products/
✅ Secure upload với JWT authentication
✅ Delete image API
✅ Client-side upload signature

## 🔒 Bảo mật

- Chỉ user đã login mới upload được
- Validate file type và size
- API Secret không expose ra client
- Sử dụng signed upload cho client-side

## 📦 Storage

- Cloudinary Free Plan: 25GB storage, 25GB bandwidth/month
- Tự động backup và CDN global
- Transformation on-the-fly
