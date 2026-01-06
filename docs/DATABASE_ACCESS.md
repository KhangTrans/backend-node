# Hướng dẫn kết nối MySQL Database

## Cách 1: Xem qua API (Đơn giản nhất)
```
GET http://localhost:5000/api/auth/users
```
Mở Postman hoặc file test.http và gọi endpoint trên.

## Cách 2: MySQL Workbench

1. Tải MySQL Workbench: https://dev.mysql.com/downloads/workbench/

2. Tạo connection mới với thông tin (lấy từ file .env):
   - **Hostname**: Xem DB_HOST trong .env
   - **Port**: Xem DB_PORT trong .env
   - **Username**: Xem DB_USER trong .env
   - **Password**: Xem DB_PASSWORD trong .env
   - **Database**: Xem DB_NAME trong .env
   - **SSL**: Required

3. Click "Test Connection" rồi "OK"

4. Chạy query:
   ```sql
   SELECT * FROM users;
   ```

## Cách 3: MySQL Command Line

```bash
mysql -h [DB_HOST] -P [DB_PORT] -u [DB_USER] -p [DB_NAME] --ssl-mode=REQUIRED
```

Thay thế [DB_HOST], [DB_PORT], [DB_USER], [DB_NAME] bằng giá trị trong file .env
Nhập password khi được yêu cầu (lấy từ DB_PASSWORD trong .env)

Sau đó chạy:
```sql
SHOW TABLES;
SELECT * FROM users;
```

## Cách 4: Aiven Console

1. Đăng nhập vào https://console.aiven.io
2. Vào MySQL service của bạn
3. Chọn tab "Query"
4. Chạy query trực tiếp trên web

## Xem cấu trúc bảng
```sql
DESCRIBE users;
```

## Một số query hữu ích

```sql
-- Đếm số users
SELECT COUNT(*) FROM users;

-- Xem users mới nhất
SELECT * FROM users ORDER BY createdAt DESC LIMIT 10;

-- Tìm user theo email
SELECT * FROM users WHERE email = 'test@example.com';

-- Xem users theo role
SELECT role, COUNT(*) as total FROM users GROUP BY role;
```
