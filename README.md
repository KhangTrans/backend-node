# E-Commerce Backend System API

Chào mừng bạn đến với dự án Backend E-Commerce hoàn chỉnh. Đây là hệ thống lõi cung cấp toàn bộ API và logic xử lý cho một nền tảng thương mại điện tử hiện đại, phục vụ cho ứng dụng web và mobile.

Dự án này được thiết kế với tiêu chí: **Kiến trúc rõ ràng, Dễ mở rộng, Hiệu năng cao và Bảo mật tốt.**

---

## �️ Kiến Trúc Hệ Thống (3-Layer Architecture)

Dự án áp dụng triệt để mô hình kiến trúc 3 tầng (3-Layer Architecture) để đảm bảo tính tách biệt, dễ bảo trì và kiểm thử.

1.  **Controller Layer (Tầng Điều Khiển)**
    - **Nhiệm vụ:** Tiếp nhận yêu cầu (Request) từ người dùng/frontend, xác thực dữ liệu đầu vào cơ bản.
    - **Nguyên tắc:** "Mỏng" (Thin). Không chứa logic nghiệp vụ phức tạp. Chỉ gọi Service và trả về kết quả (Response).
    - **Vị trí:** Thư mục `controllers/`

2.  **Service Layer (Tầng Nghiệp Vụ)**
    - **Nhiệm vụ:** Chứa toàn bộ logic nghiệp vụ (Business Logic) của hệ thống.
    - **Chức năng:** Xử lý tính toán, validate quy tắc kinh doanh, gọi DAO để lấy dữ liệu, tích hợp API bên thứ 3 (Thanh toán, AI...).
    - **Vị trí:** Thư mục `services/`

3.  **DAO Layer (Customer Data Access Object)**
    - **Nhiệm vụ:** Tương tác trực tiếp với Database (MongoDB).
    - **Chức năng:** Thực hiện các câu lệnh truy vấn (Find, Save, Update, Delete). Trả về dữ liệu thô hoặc Model cho Service.
    - **Vị trí:** Thư mục `dao/`

---

## � Cấu Trúc Thư Mục Dự Án

Cấu trúc thư mục được tổ chức khoa học để bạn dễ dàng tìm kiếm và phát triển tnh năng mới.

- `api/` - Nơi quy định các điểm đầu vào chính của API.
- `config/` - Chứa các file cấu hình hệ thống (Database, Redis, Payment gateways, Cloudinary...).
- `controllers/` - **Layer 1**: Xử lý HTTP request/response.
- `dao/` - **Layer 3**: Lớp truy xuất dữ liệu database.
- `docs/` - Tài liệu hướng dẫn chi tiết cho từng module.
- `lib/` - Các thư viện dùng chung hoặc custom modules.
- `middleware/` - Các middleware xử lý trung gian (Xác thực JWT, Cache, Logger...).
- `models/` - Định nghĩa Schema dữ liệu (MongoDB Mongoose Models).
- `routes/` - Định nghĩa các đường dẫn URL (API endpoints) và liên kết đến Controller tương ứng.
- `scripts/` - Các script tiện ích (Seed data, automation...).
- `services/` - **Layer 2**: Trung tâm xử lý logic nghiệp vụ.
- `utils/` - Các hàm tiện ích bổ trợ (Format date, Random string...).
- `demo-order-flow.js` - Script demo luồng đặt hàng (tham khảo).
- `server.js` - File khởi động chính của ứng dụng.

---

## � Tính Năng Nổi Bật

### 1. Quản Lý Sản Phẩm & Danh Mục

- CRUD sản phẩm đầy đủ với biến thể (variant).
- Quản lý danh mục đa cấp.
- Tìm kiếm và lọc sản phẩm nâng cao.

### 2. Giỏ Hàng & Đặt Hàng (Core Flow)

- Thao tác giỏ hàng thời gian thực.
- Quy trình đặt hàng (Checkout) chặt chẽ: Kiểm tra tồn kho -> Áp dụng Voucher -> Tính phí ship -> Tạo đơn.
- Hỗ trợ tính năng "Mua ngay" (Buy Now).

### 3. Thanh Toán Đa Kênh

- **COD:** Thanh toán khi nhận hàng.
- **VNPay:** Tích hợp cổng thanh toán nội địa.
- **ZaloPay:** Tích hợp ví điện tử.

### 4. Hệ Thống Voucher Thông Minh

- Voucher giảm giá theo % hoặc số tiền cố định.
- Voucher miễn phí vận chuyển.
- Điều kiện áp dụng: Giá trị đơn tối thiểu, thời gian, số lượng giới hạn.

### 5. Chatbot AI & Hỗ Trợ Khách Hàng

- Tích hợp Gemini AI để tư vấn sản phẩm tự động.
- Hệ thống Chat Real-time (Socket.io) giữa khách và admin.

### 6. Bảo Mật & Hiệu Năng

- Xác thực người dùng qua JWT (Access Token & Refresh Token).
- Phân quyền Role-based (User/Admin).
- Sử dụng Redis để caching dữ liệu thường xuyên truy cập.

---

## 🛠️ Công Nghệ Sử Dụng

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Caching:** Redis
- **Real-time:** Socket.io
- **Cloud Storage:** Cloudinary (Lưu trữ ảnh)
- **Payment:** VNPay SDK, ZaloPay SDK
- **AI Integration:** Google Gemini API

---

## 📝 Hướng Dẫn Cài Đặt & Chạy Dự Án

Để chạy dự án này trên máy local của bạn, hãy làm theo các bước đơn giản sau:

### Bước 1: Chuẩn bị môi trường

Đảm bảo máy bạn đã cài đặt:

1.  Node.js (Phiên bản mới nhất hoặc LTS)
2.  MongoDB (Hoặc có chuỗi kết nối MongoDB Atlas)
3.  Redis (Tùy chọn, để dùng tính năng cache)

### Bước 2: Cài đặt thư viện

Chạy lệnh sau tại thư mục gốc của dự án để tải về các thư viện cần thiết:
`npm install`

### Bước 3: Cấu hình biến môi trường

Tạo file `.env` tại thư mục gốc và điền các thông số cấu hình (Database URI, API Keys, JWT Secret...). Bạn có thể tham khảo file mẫu `.env.example` nếu có.

### Bước 4: Khởi chạy Server

- Chế độ phát triển (Tự động reload khi sửa code):
  `npm run dev`
- Chế độ production:
  `npm start`

Server sẽ mặc định chạy tại địa chỉ: `http://localhost:5000` (hoặc port bạn cấu hình).

---

## 🧪 Testing

Dự án hỗ trợ các script test tự động để đảm bảo tính ổn định.
Bạn có thể chạy các file test riêng lẻ trong thư mục gốc nếu cần kiểm tra chức năng cụ thể (lưu ý thay đổi cấu hình database test nếu cần).

---

## 👨‍💻 Đóng Góp

Mọi đóng góp đều được hoan nghênh! Hãy tạo Pull Request hoặc mở Issue nếu bạn tìm thấy lỗi hoặc muốn đề xuất tính năng mới.

---

_© 2026 E-Commerce Backend Project. All rights reserved._
