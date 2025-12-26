# Payment Integration Guide - VNPay & ZaloPay

## 📋 Tổng quan

Backend đã tích hợp 2 phương thức thanh toán:
- **VNPay** - Cổng thanh toán phổ biến nhất VN
- **ZaloPay** - Ví điện tử ZaloPay

---

## 🔧 Setup

### 1. Cài đặt dependencies

```bash
npm install dateformat moment axios
```

### 2. Environment Variables

Thêm vào file `.env`:

```env
# VNPay
VNPAY_TMN_CODE=YOUR_TMN_CODE
VNPAY_HASH_SECRET=YOUR_HASH_SECRET
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://frontend-ky7.vercel.app/payment/vnpay/return

# ZaloPay
ZALOPAY_APP_ID=554
ZALOPAY_KEY1=8NdU5pG5R2spGHGhyO99HN1OhD8IQJBn
ZALOPAY_KEY2=uUfsWgfLkRLzq6W2uNXTCxrfxs51auny
ZALOPAY_ENDPOINT=https://sb-openapi.zalopay.vn/v2/create
ZALOPAY_CALLBACK_URL=https://backend-node-5re9.onrender.com/api/payment/zalopay/callback
ZALOPAY_RETURN_URL=https://frontend-ky7.vercel.app/payment/zalopay/return
```

### 3. Đăng ký tài khoản Sandbox

#### VNPay:
- Merchant Admin: https://sandbox.vnpayment.vn/merchantv2/
- Email test: thicamtien2003@gmail.com
- Lấy `VNPAY_TMN_CODE` và `VNPAY_HASH_SECRET` từ merchant portal

#### ZaloPay:
- Docs: https://docs.zalopay.vn/v2/start/
- Sandbox đã config sẵn (APP_ID: 554)

---

## 🚀 API Endpoints

### VNPay

#### 1. Tạo Payment URL

```http
POST /api/payment/vnpay/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderId": 1,
  "amount": 29990000,
  "orderInfo": "Thanh toan don hang #ORD123",
  "locale": "vn"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
    "orderId": 1,
    "orderNumber": "ORD2512267434"
  }
}
```

#### 2. Return URL (sau khi thanh toán)

```http
GET /api/payment/vnpay/return?vnp_Amount=...&vnp_TxnRef=...
```

**Redirect:**
- Success: `{FRONTEND_URL}/payment/success?orderId=1&orderNumber=ORD123`
- Failed: `{FRONTEND_URL}/payment/failed?orderId=1&code=24`

#### 3. IPN (Instant Payment Notification)

```http
GET /api/payment/vnpay/ipn?vnp_Amount=...&vnp_TxnRef=...
```

**Response:**
```json
{
  "RspCode": "00",
  "Message": "Success"
}
```

---

### ZaloPay

#### 1. Tạo Payment

```http
POST /api/payment/zalopay/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderId": 1,
  "amount": 29990000,
  "orderInfo": "Thanh toan don hang #ORD123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order_url": "https://sb-openapi.zalopay.vn/v2/...",
    "zp_trans_token": "...",
    "app_trans_id": "251226_123456",
    "orderId": 1,
    "orderNumber": "ORD2512267434"
  }
}
```

#### 2. Callback (từ ZaloPay server)

```http
POST /api/payment/zalopay/callback
Content-Type: application/json

{
  "data": "{...}",
  "mac": "..."
}
```

**Response:**
```json
{
  "return_code": 1,
  "return_message": "success"
}
```

---

### Common

#### Get Payment Status

```http
GET /api/payment/status/:orderId
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": 1,
    "orderNumber": "ORD2512267434",
    "paymentMethod": "vnpay",
    "paymentStatus": "paid",
    "totalAmount": "29990000",
    "paidAt": "2025-12-26T15:30:00.000Z",
    "transactionId": "14123456"
  }
}
```

---

## 💳 Test Payment

### VNPay Test Card

```
Ngân hàng: NCB
Số thẻ: 9704198526191432198
Tên chủ thẻ: NGUYEN VAN A
Ngày phát hành: 07/15
Mật khẩu OTP: 123456
```

### ZaloPay

1. Tải app ZaloPay trên điện thoại
2. Đăng ký tài khoản sandbox
3. Quét mã QR từ `order_url`
4. Hoặc click "Thanh toán bằng Zalo" trên web

---

## 🔄 Payment Flow

### VNPay Flow:

```
1. User chọn "Thanh toán VNPay"
   ↓
2. Frontend gọi POST /api/payment/vnpay/create
   ↓
3. Backend trả về paymentUrl
   ↓
4. Frontend redirect user đến paymentUrl
   ↓
5. User nhập thông tin thẻ trên VNPay
   ↓
6. VNPay redirect về /api/payment/vnpay/return
   ↓
7. Backend verify và update order
   ↓
8. Backend redirect user về frontend (success/failed)
   ↓
9. VNPay gửi IPN đến /api/payment/vnpay/ipn (optional)
```

### ZaloPay Flow:

```
1. User chọn "Thanh toán ZaloPay"
   ↓
2. Frontend gọi POST /api/payment/zalopay/create
   ↓
3. Backend trả về order_url (có QR code)
   ↓
4. User quét QR bằng app ZaloPay
   ↓
5. User xác nhận thanh toán trong app
   ↓
6. ZaloPay gửi callback đến /api/payment/zalopay/callback
   ↓
7. Backend verify và update order
   ↓
8. Frontend poll /api/payment/status/:orderId để check status
```

---

## 🎨 Frontend Integration

### React Example

```javascript
import { useState } from 'react';
import axios from 'axios';

function PaymentPage({ order }) {
  const [loading, setLoading] = useState(false);

  // VNPay
  const payWithVNPay = async () => {
    try {
      setLoading(true);
      const { data } = await axios.post(
        'https://backend-node-lilac-seven.vercel.app/api/payment/vnpay/create',
        {
          orderId: order.id,
          amount: order.totalAmount,
          orderInfo: `Thanh toan don hang ${order.orderNumber}`
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Redirect to VNPay
      window.location.href = data.data.paymentUrl;
    } catch (error) {
      console.error('VNPay error:', error);
      alert('Lỗi khi tạo thanh toán VNPay');
    } finally {
      setLoading(false);
    }
  };

  // ZaloPay
  const payWithZaloPay = async () => {
    try {
      setLoading(true);
      const { data } = await axios.post(
        'https://backend-node-lilac-seven.vercel.app/api/payment/zalopay/create',
        {
          orderId: order.id,
          amount: order.totalAmount,
          orderInfo: `Thanh toan don hang ${order.orderNumber}`
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Redirect to ZaloPay
      window.location.href = data.data.order_url;

      // Or show QR code for scanning
      // setQrCode(data.data.order_url);

      // Poll for payment status
      const interval = setInterval(async () => {
        const status = await checkPaymentStatus(order.id);
        if (status === 'paid') {
          clearInterval(interval);
          window.location.href = '/payment/success';
        }
      }, 3000);
    } catch (error) {
      console.error('ZaloPay error:', error);
      alert('Lỗi khi tạo thanh toán ZaloPay');
    } finally {
      setLoading(false);
    }
  };

  // Check payment status
  const checkPaymentStatus = async (orderId) => {
    const { data } = await axios.get(
      `https://backend-node-lilac-seven.vercel.app/api/payment/status/${orderId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return data.data.paymentStatus;
  };

  return (
    <div>
      <h2>Chọn phương thức thanh toán</h2>
      
      <button onClick={payWithVNPay} disabled={loading}>
        Thanh toán VNPay
      </button>

      <button onClick={payWithZaloPay} disabled={loading}>
        Thanh toán ZaloPay
      </button>
    </div>
  );
}
```

### Payment Return Pages

```javascript
// /payment/success
function PaymentSuccess() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('orderId');
  const orderNumber = params.get('orderNumber');

  return (
    <div>
      <h1>✅ Thanh toán thành công!</h1>
      <p>Mã đơn hàng: {orderNumber}</p>
      <Link to={`/orders/${orderId}`}>Xem chi tiết đơn hàng</Link>
    </div>
  );
}

// /payment/failed
function PaymentFailed() {
  const params = new URLSearchParams(window.location.search);
  const message = params.get('message');

  return (
    <div>
      <h1>❌ Thanh toán thất bại</h1>
      <p>{message || 'Đã có lỗi xảy ra'}</p>
      <Link to="/cart">Quay lại giỏ hàng</Link>
    </div>
  );
}
```

---

## 🔐 Security

### VNPay Security:
- ✅ HMAC SHA512 signature verification
- ✅ Verify order ownership before payment
- ✅ Check payment status to prevent double processing
- ✅ Validate amount matches order total

### ZaloPay Security:
- ✅ HMAC SHA256 MAC verification
- ✅ Verify callback data integrity
- ✅ Parse embedded data safely
- ✅ Prevent replay attacks

---

## 🐛 Troubleshooting

### VNPay Issues:

**Problem:** Invalid signature
```
Solution: Check VNPAY_HASH_SECRET in .env matches merchant portal
```

**Problem:** Order not found
```
Solution: Make sure order exists and orderNumber is correct
```

### ZaloPay Issues:

**Problem:** MAC not equal
```
Solution: Verify ZALOPAY_KEY2 is correct
```

**Problem:** Callback not received
```
Solution: 
1. Check ZALOPAY_CALLBACK_URL is publicly accessible
2. Use ngrok for local testing: ngrok http 5000
3. Update callback URL in ZaloPay config
```

---

## 📝 Notes

### VNPay:
- Hỗ trợ nhiều ngân hàng (ATM, visa, mastercard, JCB, etc.)
- Return URL và IPN đều cần verify signature
- Test trên sandbox trước khi lên production

### ZaloPay:
- Cần app ZaloPay để test
- Callback URL phải public (không dùng localhost)
- Dùng polling để check payment status từ frontend

### Common:
- Update `FRONTEND_URL` trong environment variables
- Đảm bảo callback URLs accessible từ internet
- Test thoroughly trước khi deploy production
- Monitor payment logs thường xuyên

---

## 🚀 Deployment

### Vercel (REST API):
```env
# Add to Vercel environment variables
VNPAY_TMN_CODE=...
VNPAY_HASH_SECRET=...
ZALOPAY_APP_ID=554
ZALOPAY_KEY1=...
ZALOPAY_KEY2=...
```

### Render (Socket.IO):
```env
# ZaloPay callback should point to this server
ZALOPAY_CALLBACK_URL=https://backend-node-5re9.onrender.com/api/payment/zalopay/callback
```

**⚠️ Important:** VNPay/ZaloPay callbacks cần URL public. Không thể test với localhost!

---

## ✅ Testing Checklist

- [ ] VNPay payment URL được tạo thành công
- [ ] Redirect đến VNPay và nhập thông tin thẻ test
- [ ] Return URL nhận được response từ VNPay
- [ ] Order status được update thành 'paid'
- [ ] Frontend redirect đúng trang success/failed
- [ ] ZaloPay order được tạo thành công
- [ ] Quét QR code bằng app ZaloPay
- [ ] Callback được gọi và verify MAC
- [ ] Order status được update qua callback
- [ ] Frontend polling nhận được status 'paid'

---

🎉 **Payment integration hoàn tất!** Test thử và báo lỗi nếu có nhé!
