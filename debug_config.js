require('dotenv').config();

const vnpayConfig = {
  vnp_TmnCode: process.env.VNPAY_TMN_CODE,
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET,
  vnp_Url: process.env.VNPAY_URL,
  vnp_Api: process.env.VNPAY_API,
  vnp_ReturnUrl: process.env.VNPAY_RETURN_URL
};

console.log('--- VNPay Configuration Check ---');
console.log('TMN Code:', vnpayConfig.vnp_TmnCode || 'NOT SET');
console.log('Hash Secret:', vnpayConfig.vnp_HashSecret ? (vnpayConfig.vnp_HashSecret.substring(0, 5) + '...') : 'NOT SET');
console.log('URL:', vnpayConfig.vnp_Url || 'NOT SET');
console.log('API:', vnpayConfig.vnp_Api || 'NOT SET');
console.log('Return URL:', vnpayConfig.vnp_ReturnUrl || 'NOT SET');
