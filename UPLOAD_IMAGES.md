# Hướng Dẫn Upload Hình Ảnh

## Vấn Đề với Vercel Serverless

Vercel là môi trường serverless và **không hỗ trợ tốt** việc upload file truyền thống với `multipart/form-data` và `multer`. Do đó, chúng ta cần sử dụng phương pháp **Base64** để upload hình ảnh.

## ✅ Phương Pháp Upload Được Khuyến Nghị

### 1. Upload Hình Ảnh Bằng Base64 (Hoạt động trên Vercel)

**Endpoint:** `POST /api/upload/base64`

**Request:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...",
  "folder": "products"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/xxx/image/upload/v123/products/image.jpg",
    "publicId": "products/image",
    "width": 1000,
    "height": 1000,
    "format": "jpg",
    "size": 123456
  }
}
```

### 2. Lấy Upload Signature (Client-side Upload)

**Endpoint:** `GET /api/upload/signature?folder=products`

Dùng để upload trực tiếp từ client lên Cloudinary.

**Response:**
```json
{
  "success": true,
  "data": {
    "signature": "abc123...",
    "timestamp": 1234567890,
    "cloudName": "your-cloud-name",
    "apiKey": "your-api-key",
    "folder": "products"
  }
}
```

## 📝 Cách Chuyển Đổi File sang Base64

### Trong JavaScript (Frontend)

```javascript
// Chọn file từ input
const fileInput = document.getElementById('imageInput');
const file = fileInput.files[0];

// Chuyển đổi sang base64
const reader = new FileReader();
reader.readAsDataURL(file);
reader.onload = async () => {
  const base64Image = reader.result;
  
  // Upload lên server
  const response = await fetch('/api/upload/base64', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: JSON.stringify({
      image: base64Image,
      folder: 'products'
    })
  });
  
  const result = await response.json();
  console.log('Uploaded:', result.data.url);
};
```

### Trong React

```jsx
const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  
  // Chuyển đổi sang base64
  const base64 = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
  
  // Upload
  const response = await fetch('/api/upload/base64', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      image: base64,
      folder: 'products'
    })
  });
  
  const data = await response.json();
  setImageUrl(data.data.url);
};
```

### Trong Node.js (Testing)

```javascript
const fs = require('fs');

// Đọc file và chuyển sang base64
const imageBuffer = fs.readFileSync('./image.jpg');
const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

// Upload
fetch('http://localhost:5000/api/upload/base64', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    image: base64Image,
    folder: 'products'
  })
});
```

## 🔄 Tạo/Cập Nhật Sản Phẩm với Hình Ảnh

### Tạo sản phẩm mới

```javascript
// Bước 1: Upload hình ảnh
const uploadedImages = [];
for (const file of files) {
  const base64 = await convertToBase64(file);
  const response = await fetch('/api/upload/base64', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ image: base64, folder: 'products' })
  });
  const data = await response.json();
  uploadedImages.push(data.data.url);
}

// Bước 2: Tạo sản phẩm với URLs hình ảnh
const product = await fetch('/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'iPhone 15 Pro Max',
    price: 29990000,
    stock: 100,
    categoryId: 1,
    images: uploadedImages.map((url, index) => ({
      imageUrl: url,
      isPrimary: index === 0,
      order: index
    }))
  })
});
```

### Cập nhật sản phẩm với hình ảnh mới

```javascript
// Upload hình ảnh mới
const newImages = [];
for (const file of files) {
  const base64 = await convertToBase64(file);
  const response = await fetch('/api/upload/base64', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ image: base64, folder: 'products' })
  });
  const data = await response.json();
  newImages.push(data.data.url);
}

// Cập nhật sản phẩm
await fetch('/api/products/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'iPhone 15 Pro Max - Updated',
    price: 28990000,
    images: newImages.map((url, index) => ({
      imageUrl: url,
      isPrimary: index === 0,
      order: index
    }))
  })
});
```

## 🗑️ Xóa Hình Ảnh

```javascript
// publicId ví dụ: "products/1735123456-iphone"
const publicId = 'products/1735123456-iphone';

await fetch(`/api/upload/image/${encodeURIComponent(publicId)}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## ⚠️ Lưu Ý Quan Trọng

1. **Vercel Serverless**: Chỉ sử dụng `/api/upload/base64` khi deploy lên Vercel
2. **Giới hạn kích thước**: Vercel có giới hạn request body 4.5MB cho free plan
3. **Nén ảnh trước khi upload**: Nên resize/compress ảnh trên client trước khi upload
4. **Token bắt buộc**: Tất cả endpoints upload đều cần authentication token

## 🎨 Thư Viện Hỗ Trợ

### Nén/Resize ảnh trước khi upload

```bash
npm install browser-image-compression
```

```javascript
import imageCompression from 'browser-image-compression';

const options = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true
};

const compressedFile = await imageCompression(file, options);
const base64 = await convertToBase64(compressedFile);
```

## 📚 API Endpoints Tổng Hợp

| Method | Endpoint | Mô tả | Serverless |
|--------|----------|-------|------------|
| POST | `/api/upload/base64` | Upload hình base64 | ✅ |
| GET | `/api/upload/signature` | Lấy signature cho client upload | ✅ |
| POST | `/api/upload/image` | Upload với multer | ❌ |
| POST | `/api/upload/images` | Upload nhiều ảnh với multer | ❌ |
| DELETE | `/api/upload/image/:publicId` | Xóa hình ảnh | ✅ |
