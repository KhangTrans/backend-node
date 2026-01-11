const crypto = require('crypto');
const querystring = require('querystring');

const secretKey = 'C1VQKHGREPTR1H55PRKBZV5OX3LSDQWS'; // Current Key
const params = {
  vnp_Amount: '3002000000',
  vnp_Command: 'pay',
  vnp_CreateDate: '20260112051813',
  vnp_CurrCode: 'VND',
  vnp_IpAddr: '27.64.219.94',
  vnp_Locale: 'vn',
  vnp_OrderInfo: 'Thanh toan don hang 696421a3bcb19090fbde5691',
  vnp_OrderType: 'other',
  vnp_ReturnUrl: 'https://khangtrandev.id.vn/payment/vnpay/return', // Corrected URL
  vnp_TmnCode: 'BDTRQ8G8',
  vnp_TxnRef: 'ORD2601115440',
  vnp_Version: '2.1.0'
};

const sortedKeys = Object.keys(params).sort();
const signData = sortedKeys.map(key => `${key}=${params[key]}`).join('&');

const hmac = crypto.createHmac("sha512", secretKey);
const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

console.log("Calculated:", signed);
console.log("From URL:  ", "032d1189500d6d22a7495a1b6597a3aaa821c85131c0e3af5d0dadd40de4ebb0e3201b9f6ff91227c4546211ac21d75a475152986acee7e5fa7f70c01dd4a22d");
console.log("Match?", signed === "032d1189500d6d22a7495a1b6597a3aaa821c85131c0e3af5d0dadd40de4ebb0e3201b9f6ff91227c4546211ac21d75a475152986acee7e5fa7f70c01dd4a22d");
