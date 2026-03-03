# Prompt: Xây dựng chức năng Đăng nhập / Đăng ký cho ứng dụng React Native

## Bối cảnh

Tôi có một Backend API (Node.js + Express + MongoDB) đã hoàn chỉnh. Hãy giúp tôi viết phần **Frontend React Native (Expo)** cho chức năng **Đăng nhập, Đăng ký, và Xác thực email**.

---

## Base URL

```
Production: https://backend-node-5re9.onrender.com
Dev:        http://localhost:5000
```

---

## Các API Endpoints cần tích hợp

### 1. Đăng ký - `POST /api/auth/register`

**Request Body:**

```json
{
  "username": "string (3-30 ký tự, chỉ chữ, số, dấu _)",
  "email": "string (email hợp lệ)",
  "password": "string (tối thiểu 6 ký tự)",
  "fullName": "string (tùy chọn)"
}
```

**Response thành công (201):**

```json
{
  "success": true,
  "message": "Đăng ký thành công. Vui lòng kiểm tra email để xác thực.",
  "data": {
    "user": {
      "id": "ObjectId",
      "username": "string",
      "email": "string",
      "fullName": "string",
      "role": "user"
    }
  }
}
```

**Response lỗi (400):**

```json
{
  "success": false,
  "message": "Username or email already exists"
}
```

**Lưu ý:** Sau khi đăng ký, user **CHƯA** được đăng nhập. Phải xác thực email trước.

---

### 2. Đăng nhập - `POST /api/auth/login`

**Request Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response thành công (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "ObjectId",
      "username": "string",
      "email": "string",
      "fullName": "string",
      "role": "user | admin"
    },
    "token": "JWT_TOKEN_STRING"
  }
}
```

**Response lỗi (401):**

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Các lỗi có thể xảy ra:**

- `"Invalid credentials"` → Sai email hoặc mật khẩu
- `"Account has been deactivated"` → Tài khoản bị khóa
- `"Vui lòng xác thực email trước khi đăng nhập"` → Email chưa xác thực

---

### 3. Xác thực email - `POST /api/auth/verify-email`

**Request Body:**

```json
{
  "token": "verification_token_from_email_link"
}
```

**Response thành công (200):**

```json
{
  "success": true,
  "message": "Xác thực email thành công",
  "data": {
    "user": { ... },
    "token": "JWT_TOKEN_STRING"
  }
}
```

---

### 4. Lấy thông tin user hiện tại - `GET /api/auth/me`

**Headers:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Response thành công (200):**

```json
{
  "success": true,
  "data": {
    "_id": "ObjectId",
    "username": "string",
    "email": "string",
    "fullName": "string",
    "role": "user | admin",
    "avatar": "url | null",
    "isActive": true,
    "createdAt": "ISO Date"
  }
}
```

---

### 5. Đăng nhập Google (Mobile) - `POST /api/auth/google/token`

**Request Body:**

```json
{
  "googleId": "string",
  "email": "string",
  "fullName": "string (optional)",
  "avatar": "string url (optional)"
}
```

**Response thành công (200):**

```json
{
  "success": true,
  "message": "Google login successful",
  "data": {
    "user": {
      "id": "ObjectId",
      "username": "string",
      "email": "string",
      "fullName": "string",
      "avatar": "string",
      "role": "user",
      "authProvider": "google"
    },
    "token": "JWT_TOKEN_STRING"
  }
}
```

---

## Yêu cầu chi tiết cho Frontend

### Màn hình cần tạo:

1. **LoginScreen** - Màn hình đăng nhập
   - Form: Email + Password
   - Nút "Đăng nhập"
   - Nút "Đăng nhập bằng Google"
   - Link "Chưa có tài khoản? Đăng ký"
   - Hiển thị lỗi phù hợp theo message từ API

2. **RegisterScreen** - Màn hình đăng ký
   - Form: Username + Email + Password + Full Name (tùy chọn)
   - Validate trước khi gửi:
     - Username: 3-30 ký tự, chỉ chữ/số/underscore
     - Email: format hợp lệ
     - Password: tối thiểu 6 ký tự
   - Sau khi đăng ký thành công → hiển thị thông báo "Kiểm tra email để xác thực"
   - Link "Đã có tài khoản? Đăng nhập"

3. **EmailVerificationScreen** (tùy chọn) - Màn hình thông báo xác thực email
   - Hiển thị hướng dẫn user mở email và click link xác thực

### Quản lý Token (JWT):

- Lưu token vào **AsyncStorage** sau khi đăng nhập thành công
- Tạo **Axios instance** với interceptor tự động gắn `Authorization: Bearer <token>` vào mọi request
- Khi nhận response **401** → xóa token, chuyển về màn hình Login
- Khi mở app → kiểm tra token trong AsyncStorage:
  - Có token → gọi `GET /api/auth/me` để verify
  - Token hợp lệ → vào Home
  - Token hết hạn/lỗi → xóa token, về Login

### Cấu trúc code đề xuất:

```
src/
├── api/
│   └── axiosInstance.js      # Axios config + interceptors
├── context/
│   └── AuthContext.js        # Auth state management (React Context)
├── screens/
│   ├── LoginScreen.js
│   ├── RegisterScreen.js
│   └── EmailVerifyScreen.js
├── navigation/
│   └── AppNavigator.js       # Điều hướng Auth Stack vs Main Stack
└── utils/
    └── storage.js            # AsyncStorage helpers
```

### Lưu ý quan trọng:

1. **Rate Limiting**: API có giới hạn **100 requests / 15 phút / IP**. Nếu bị lỗi **429**, hiển thị thông báo "Vui lòng thử lại sau".

2. **Token hết hạn sau 7 ngày** (`JWT_EXPIRE=7d`).

3. **Không gửi request liên tục** khi user nhấn nút nhiều lần → disable nút khi đang loading.

4. **Google Login trên mobile**: Dùng `expo-auth-session` hoặc `@react-native-google-signin/google-signin` để lấy `googleId` và `email`, sau đó gọi `POST /api/auth/google/token`.

5. **UI/UX**: Thiết kế hiện đại, có loading indicator, hiệu ứng chuyển trang mượt mà.
