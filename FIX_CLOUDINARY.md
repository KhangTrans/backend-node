# ⚠️ LỖI CLOUDINARY API SECRET SAI

## Vấn đề hiện tại
API Secret trong file `.env` không đúng, dẫn đến lỗi "Invalid Signature" khi upload.

## ✅ Cách sửa lỗi

### Bước 1: Vào Cloudinary Dashboard
1. Truy cập: https://cloudinary.com/console
2. Đăng nhập vào tài khoản của bạn
3. Vào phần **Settings** → **API Keys**

### Bước 2: Copy chính xác API Credentials
Tại trang API Keys, bạn sẽ thấy:
- **Cloud name**: dsom4uuux (đã đúng)
- **API Key**: 456735213468847 (đã đúng)
- **API Secret**: Click vào icon "eye" 👁️ để hiển thị, sau đó COPY CHÍNH XÁC

### Bước 3: Cập nhật file `.env`
```env
CLOUDINARY_CLOUD_NAME=dsom4uuux
CLOUDINARY_API_KEY=456735213468847
CLOUDINARY_API_SECRET=<PASTE_CHÍNH_XÁC_Ở_ĐÂY>
```

**⚠️ LƯU Ý QUAN TRỌNG:**
- Không có khoảng trắng trước hoặc sau API Secret
- Phân biệt chữ HOA/thường
- Phân biệt: số 0 (zero) vs chữ O, số 1 (one) vs chữ l (L thường) vs chữ I (i hoa)
- API Secret thường dài 27 ký tự

### Bước 4: Test lại
Sau khi cập nhật `.env`, chạy lại test:
```bash
node test-cloudinary-simple.js
```

Nếu thành công, bạn sẽ thấy:
```
✅ SUCCESS! Connected to Cloudinary
```

## 🔐 API Secret hiện tại
Từ hình ảnh bạn cung cấp, API Secret có vẻ là:
```
1o0dN-j_hSDri3AuyFd2Ce8uozI
```

Nhưng có thể có ký tự bị nhầm lẫn:
- `1o0dN` - chữ "o" thường hay số "0"?
- `j_hSDri3` - chữ "j" hay "J"?
- `Ce8uozI` - chữ "I" hoa cuối hay chữ "l" thường?

## 💡 Các ký tự dễ nhầm lẫn:
- `0` (số không) vs `O` (chữ O hoa)
- `1` (số một) vs `l` (chữ L thường) vs `I` (chữ i hoa)
- `8` (số tám) vs `B` (chữ B hoa)

## 🚀 Sau khi sửa xong
Chạy các lệnh sau để test:

```bash
# Test kết nối
node test-cloudinary-simple.js

# Test upload đầy đủ
node test-cloudinary.js
```

## 📝 Nếu vẫn lỗi
1. Thử tạo lại API Key mới trong Cloudinary Dashboard
2. Copy chính xác và paste vào .env
3. Restart terminal và test lại
