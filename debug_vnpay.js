const crypto = require('crypto');
const querystring = require('querystring');

const secretKey = 'RT0UBKYFBJX8B56RH7WUJJO8EICZRUAF'; // NEW Key
const params = {
  vnp_Amount: '3002000000',
  vnp_Command: 'pay',
  vnp_CreateDate: '20260112053455',
  vnp_CurrCode: 'VND',
  vnp_IpAddr: '27.64.219.94',
  vnp_Locale: 'vn',
  vnp_OrderInfo: 'Thanh toan don hang 6964258e1ae6b6f080614ad1',
  vnp_OrderType: 'other',
  vnp_ReturnUrl: 'https://khangtrandev.id.vn/payment/vnpay/return',
  vnp_TmnCode: 'TWAPOHRH',
  vnp_TxnRef: 'ORD2601114359',
  vnp_Version: '2.1.0'
};

const sortedKeys = Object.keys(params).sort();
const signData = sortedKeys.map(key => `${key}=${params[key]}`).join('&');

const hmac = crypto.createHmac("sha512", secretKey);
const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

console.log("Calculated:", signed);
console.log("From URL:  ", "e586dc5b91dabed56c066dec57001bb8a44aa777ffb1df59e56d33ad6c0d3e565347ad84be6c35a89c647ed7e1f7a685698aae67b40536eaea5ed471c29c2382");
console.log("Match?", signed === "e586dc5b91dabed56c066dec57001bb8a44aa777ffb1df59e56d33ad6c0d3e565347ad84be6c35a89c647ed7e1f7a685698aae67b40536eaea5ed471c29c2382");
