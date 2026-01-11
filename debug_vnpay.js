const crypto = require('crypto');
const querystring = require('querystring');

const secretKey = 'C1VQKHGREPTR1H55PRKBZV5OX3LSDQWS'; // Key from your .env
const params = {
  vnp_Amount: '3002000000',
  vnp_Command: 'pay',
  vnp_CreateDate: '20260111154448',
  vnp_CurrCode: 'VND',
  vnp_IpAddr: '27.64.219.94',
  vnp_Locale: 'vn',
  vnp_OrderInfo: 'Thanh toan don hang 6963c56e5522c3edbb378a72',
  vnp_OrderType: 'other',
  vnp_ReturnUrl: 'https://khangtrandev.id.vn/payment/vnpay/return',
  vnp_TmnCode: 'BDTRQ8G8',
  vnp_TxnRef: 'ORD2601110543',
  vnp_Version: '2.1.0'
};

// Sort
const sortedKeys = Object.keys(params).sort();

// Create Raw Sign Data (Exactly as my code does)
const signData = sortedKeys.map(key => `${key}=${params[key]}`).join('&');

// Create Hash
const hmac = crypto.createHmac("sha512", secretKey);
const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

console.log("Calculated Hash:", signed);
console.log("Target Hash (from URL):", "50c3560639d1cd4dfa33e81630dd529fe0d37ead7011a6bbb5c80df5ad3e9fca987ecbb6b2085d89c2b7be91e447f54556d99325292e61956187d2653ae53fab");
console.log("Match?", signed === "50c3560639d1cd4dfa33e81630dd529fe0d37ead7011a6bbb5c80df5ad3e9fca987ecbb6b2085d89c2b7be91e447f54556d99325292e61956187d2653ae53fab");
console.log("Raw SignData used:", signData);
