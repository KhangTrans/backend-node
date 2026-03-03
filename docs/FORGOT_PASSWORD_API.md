# API Quên Mật Khẩu (Forgot Password)

## Tổng quan

Chức năng quên mật khẩu sử dụng **mã OTP 6 chữ số** được gửi qua email. Quy trình gồm 2 bước:

1. **Yêu cầu OTP**: Người dùng nhập email, hệ thống gửi mã OTP
2. **Đặt lại mật khẩu**: Người dùng nhập OTP + mật khẩu mới để reset

---

## 🔄 Quy trình (Flow)

```
┌─────────────┐
│  Người dùng │
│  quên MK    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Bước 1: Nhập email                 │
│  POST /api/auth/forgot-password     │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Hệ thống gửi OTP (6 số) qua email │
│  OTP có hiệu lực 10 phút            │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Bước 2: Nhập OTP + mật khẩu mới    │
│  POST /api/auth/reset-password      │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  ✓ Đặt lại mật khẩu thành công      │
│  → Chuyển đến trang đăng nhập       │
└─────────────────────────────────────┘
```

---

## 📡 API Endpoints

### 1. Yêu cầu OTP qua Email

**Endpoint**: `POST /api/auth/forgot-password`

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response Success** (200):
```json
{
  "success": true,
  "message": "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư."
}
```

**Response Error** (500):
```json
{
  "success": false,
  "message": "Gửi mã OTP thất bại. Vui lòng thử lại sau.",
  "error": "Error details..."
}
```

**Lưu ý an toàn**: API sẽ trả về success message ngay cả khi email không tồn tại (để tránh tiết lộ thông tin người dùng).

---

### 2. Đặt lại mật khẩu với OTP

**Endpoint**: `POST /api/auth/reset-password`

**Request Body**:
```json
{
  "email": "user@example.com",
  "otp": "267409",
  "newPassword": "newSecurePassword123"
}
```

**Validation**:
- `email`: Bắt buộc, phải là email hợp lệ
- `otp`: Bắt buộc, phải là 6 chữ số
- `newPassword`: Bắt buộc, tối thiểu 6 ký tự

**Response Success** (200):
```json
{
  "success": true,
  "message": "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới."
}
```

**Response Error** (400):
```json
{
  "success": false,
  "message": "Mã OTP không chính xác"
}
```

**Các lỗi có thể gặp**:
- `"Email là bắt buộc"` - Thiếu email
- `"Email, mã OTP và mật khẩu mới là bắt buộc"` - Thiếu trường
- `"Mật khẩu mới phải có ít nhất 6 ký tự"` - Mật khẩu quá ngắn
- `"Email không tồn tại"` - Email không có trong hệ thống
- `"Mã OTP không hợp lệ hoặc đã hết hạn"` - OTP sai hoặc hết hạn
- `"Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới."` - OTP quá 10 phút
- `"Mã OTP không chính xác"` - OTP sai
- `"Tài khoản đã bị vô hiệu hóa"` - Tài khoản bị khóa

---

## 💻 Code Examples cho Frontend

### React/Next.js Example với Axios

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/auth';

// Bước 1: Gửi yêu cầu OTP
export const requestPasswordReset = async (email) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/forgot-password`, {
      email
    });
    
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Có lỗi xảy ra'
    };
  }
};

// Bước 2: Đặt lại mật khẩu
export const resetPassword = async (email, otp, newPassword) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/reset-password`, {
      email,
      otp,
      newPassword
    });
    
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Có lỗi xảy ra'
    };
  }
};
```

### React Component Example

```jsx
import React, { useState } from 'react';
import { requestPasswordReset, resetPassword } from './api/auth';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: nhập email, 2: nhập OTP
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Xử lý bước 1: Gửi OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const result = await requestPasswordReset(email);
    
    setLoading(false);
    setMessage({
      type: result.success ? 'success' : 'error',
      text: result.message
    });

    if (result.success) {
      setStep(2); // Chuyển sang bước 2
    }
  };

  // Xử lý bước 2: Reset mật khẩu
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const result = await resetPassword(email, otp, newPassword);
    
    setLoading(false);
    setMessage({
      type: result.success ? 'success' : 'error',
      text: result.message
    });

    if (result.success) {
      // Chuyển đến trang đăng nhập sau 2 giây
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
  };

  return (
    <div className="forgot-password-container">
      <h2>Quên mật khẩu</h2>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {step === 1 ? (
        // Form bước 1: Nhập email
        <form onSubmit={handleRequestOTP}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn"
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
          </button>
        </form>
      ) : (
        // Form bước 2: Nhập OTP và mật khẩu mới
        <form onSubmit={handleResetPassword}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="readonly"
            />
          </div>
          <div className="form-group">
            <label>Mã OTP (6 chữ số)</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Nhập mã OTP từ email"
              maxLength={6}
              pattern="[0-9]{6}"
              required
            />
            <small>Kiểm tra hộp thư email của bạn</small>
          </div>
          <div className="form-group">
            <label>Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              minLength={6}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </button>
          <button 
            type="button" 
            onClick={() => setStep(1)}
            className="btn-secondary"
          >
            Quay lại
          </button>
        </form>
      )}
    </div>
  );
}
```

### Vue.js Example

```vue
<template>
  <div class="forgot-password">
    <h2>Quên mật khẩu</h2>
    
    <div v-if="message" :class="`alert alert-${message.type}`">
      {{ message.text }}
    </div>

    <!-- Bước 1: Nhập email -->
    <form v-if="step === 1" @submit.prevent="requestOTP">
      <div class="form-group">
        <label>Email</label>
        <input 
          v-model="email" 
          type="email" 
          placeholder="Nhập email của bạn"
          required 
        />
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Đang gửi...' : 'Gửi mã OTP' }}
      </button>
    </form>

    <!-- Bước 2: Nhập OTP và mật khẩu mới -->
    <form v-else @submit.prevent="resetPassword">
      <div class="form-group">
        <label>Mã OTP</label>
        <input 
          v-model="otp" 
          type="text" 
          maxlength="6"
          placeholder="Nhập mã 6 chữ số"
          required 
        />
      </div>
      <div class="form-group">
        <label>Mật khẩu mới</label>
        <input 
          v-model="newPassword" 
          type="password" 
          minlength="6"
          placeholder="Tối thiểu 6 ký tự"
          required 
        />
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/auth';

const step = ref(1);
const email = ref('');
const otp = ref('');
const newPassword = ref('');
const loading = ref(false);
const message = ref(null);

const requestOTP = async () => {
  loading.value = true;
  message.value = null;

  try {
    const response = await axios.post(`${API_BASE_URL}/forgot-password`, {
      email: email.value
    });
    
    message.value = {
      type: 'success',
      text: response.data.message
    };
    step.value = 2;
  } catch (error) {
    message.value = {
      type: 'error',
      text: error.response?.data?.message || 'Có lỗi xảy ra'
    };
  } finally {
    loading.value = false;
  }
};

const resetPassword = async () => {
  loading.value = true;
  message.value = null;

  try {
    const response = await axios.post(`${API_BASE_URL}/reset-password`, {
      email: email.value,
      otp: otp.value,
      newPassword: newPassword.value
    });
    
    message.value = {
      type: 'success',
      text: response.data.message
    };
    
    // Redirect sau 2 giây
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  } catch (error) {
    message.value = {
      type: 'error',
      text: error.response?.data?.message || 'Có lỗi xảy ra'
    };
  } finally {
    loading.value = false;
  }
};
</script>
```

---

## 🎨 UI/UX Recommendations

### Màn hình 1: Nhập Email
- Input email với validation
- Button "Gửi mã OTP"
- Link quay lại trang đăng nhập
- Thông báo: "Chúng tôi sẽ gửi mã OTP gồm 6 chữ số đến email của bạn"

### Màn hình 2: Nhập OTP và Mật khẩu mới
- Hiển thị email (readonly/disabled)
- Input OTP (6 chữ số, kiểu number hoặc text với pattern)
- Input mật khẩu mới (type="password", min 6 chars)
- Input xác nhận mật khẩu mới (optional nhưng recommended)
- Button "Đặt lại mật khẩu"
- Button/Link "Gửi lại mã OTP" (nếu hết hạn)
- Countdown timer: "Mã OTP hết hạn sau: 9:45"

### Thông báo quan trọng
- ✅ "Vui lòng kiểm tra hộp thư email (cả thư mục spam)"
- ⏰ "Mã OTP có hiệu lực trong 10 phút"
- 🔄 "Bạn có thể yêu cầu mã mới nếu chưa nhận được"

---

## ⚠️ Error Handling

```javascript
const handleError = (error) => {
  const message = error.response?.data?.message;
  
  switch (message) {
    case 'Mã OTP không chính xác':
      return 'Mã OTP không đúng. Vui lòng kiểm tra lại email.';
    
    case 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.':
      return 'Mã OTP đã hết hạn. Click "Gửi lại mã OTP" để nhận mã mới.';
    
    case 'Email không tồn tại':
      return 'Email này chưa được đăng ký trong hệ thống.';
    
    case 'Mật khẩu mới phải có ít nhất 6 ký tự':
      return 'Mật khẩu phải có ít nhất 6 ký tự.';
    
    default:
      return message || 'Có lỗi xảy ra. Vui lòng thử lại.';
  }
};
```

---

## 🔒 Security Features

1. **OTP hết hạn**: 10 phút sau khi tạo
2. **One-time use**: OTP bị xóa ngay sau khi reset thành công
3. **Rate limiting**: Nên implement ở frontend để tránh spam
4. **Email privacy**: API không tiết lộ email có tồn tại hay không
5. **Password hashing**: Mật khẩu được hash bằng bcrypt trước khi lưu

---

## 📧 Email Template Preview

Email người dùng nhận được sẽ trông như sau:

```
Tiêu đề: Mã OTP đặt lại mật khẩu

Nội dung:
─────────────────────
Đặt lại mật khẩu

Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.
Mã OTP của bạn là:

    267409

Mã OTP này sẽ hết hạn sau 10 phút.

Nếu bạn không yêu cầu đặt lại mật khẩu, 
vui lòng bỏ qua email này.
─────────────────────
```

---

## 🧪 Testing

### Test Cases cần cover:

✅ **Happy Path**:
1. Nhập email hợp lệ → Nhận OTP
2. Nhập OTP đúng + mật khẩu mới → Reset thành công
3. Đăng nhập với mật khẩu mới → Thành công

✅ **Edge Cases**:
1. Email không tồn tại → Vẫn show success (security)
2. OTP sai → Hiện lỗi rõ ràng
3. OTP hết hạn → Hiện lỗi, suggest gửi lại
4. Mật khẩu quá ngắn → Validation error
5. Thiếu trường required → Validation error
6. OTP sai format → Validation error

### Postman Collection

Bạn có thể import các request sau vào Postman:

```json
{
  "info": {
    "name": "Forgot Password API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Request OTP",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"user@example.com\"\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/auth/forgot-password",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "auth", "forgot-password"]
        }
      }
    },
    {
      "name": "2. Reset Password with OTP",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"user@example.com\",\n  \"otp\": \"123456\",\n  \"newPassword\": \"newPassword123\"\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/auth/reset-password",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "auth", "reset-password"]
        }
      }
    }
  ]
}
```

---

## 🚀 Deployment Notes

### Environment Variables cần có:

```env
# Email Service (Postmark)
SMTP_PASSWORD=your-postmark-api-key
FROM_EMAIL=noreply@yourdomain.com

# Frontend URL (để gửi link trong email nếu cần)
FRONTEND_URL=https://yourdomain.com

# JWT (đã có sẵn)
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=7d
```

### Production Checklist:

- [ ] Đã test trên staging environment
- [ ] Email service (Postmark) hoạt động tốt
- [ ] Rate limiting được enable
- [ ] Logging được implement
- [ ] Error messages không tiết lộ thông tin nhạy cảm
- [ ] HTTPS được enable
- [ ] CORS được config đúng

---

## 📞 Support

Nếu có vấn đề khi tích hợp, liên hệ:
- Backend Team: [Link to Slack/Discord]
- Documentation: [Link to full API docs]

---

**Phiên bản**: 1.0.0  
**Cập nhật lần cuối**: 4/3/2026
