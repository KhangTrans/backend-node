# Backend API - Node.js Authentication

Backend API với tính năng đăng ký và đăng nhập người dùng sử dụng MySQL.

## Công nghệ sử dụng

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MySQL** - Database
- **Sequelize** - ORM for MySQL
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình môi trường

Chỉnh sửa file `.env` (đã cấu hình sẵn với Aiven MySQL):

```
PORT=5000
DB_HOST=your_mysql_host
DB_PORT=your_mysql_port
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d
```

**Lưu ý:** File `.env` chứa thông tin nhạy cảm và đã được thêm vào `.gitignore`, không push lên GitHub.

### 3. Khởi chạy server

Database sẽ tự động kết nối đến Aiven MySQL và tạo bảng cần thiết.

```bash
# Development mode với nodemon
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại: `http://localhost:5000`

## 🌐 Deployment

**Production URL:** https://backend-node-lilac-seven.vercel.app/

Dự án đã được deploy lên **Vercel**. 

### Deploy lại khi có thay đổi:
```bash
git add .
git commit -m "Your commit message"
git push origin master
```

Vercel sẽ tự động deploy khi có commit mới trên branch master.

### Environment Variables trên Vercel:
Cần thêm các biến môi trường sau trong Vercel Dashboard:
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_EXPIRE`

## API Endpoints

### Authentication

#### 1. Đăng ký người dùng
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "123456",
  "fullName": "Test User"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "username": "testuser",
      "email": "test@example.com",
      "fullName": "Test User",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. Đăng nhập
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "username": "testuser",
      "email": "test@example.com",
      "fullName": "Test User",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. Lấy thông tin user hiện tại (Protected route)
```
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "username": "testuser",
    "email": "test@example.com",
    "fullName": "Test User",
    "role": "user",
    "isActive": true,
    "createdAt": "2025-12-23T..."
  }
}
```

## Cấu trúc thư mục

```
Backend/
├── config/           # Database configuration
│   └── database.js
├── controllers/      # Business logic
│   └── auth.controller.js
├── middleware/       # Custom middleware
│   └── auth.middleware.js
├── models/          # Database models
│   └── User.model.js
├── routes/          # API routes
│   └── auth.routes.js
├── .env            # Environment variables
├── .gitignore      # Git ignore file
├── package.json    # Dependencies
├── README.md       # Documentation
└── server.js       # Entry point
```

## Bảo mật

- Mật khẩu được hash bằng bcryptjs
- JWT token để xác thực
- Express-validator để validate input
- CORS enabled
- Sensitive data không được trả về trong response

## Testing với Postman/Thunder Client

1. Register một user mới
2. Copy token từ response
3. Sử dụng token trong header Authorization: Bearer <token> cho các protected routes

## Phát triển tiếp

- [ ] Forgot password
- [ ] Email verification
- [ ] Refresh token
- [ ] Rate limiting
- [ ] File upload
- [ ] User profile update
- [ ] Admin dashboard
