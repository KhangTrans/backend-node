const crypto = require("crypto");
const querystring = require("querystring");

console.log("----------------------------------------");
console.log("TEST LINK VNPAY");
console.log("----------------------------------------");

// 1. CẤU HÌNH (Chính xác 100% key mới bạn đưa)
const tmnCode = "TWAPOHRH";
const secretKey = "RT0UBKYFBJX8B56RH7WUJJO8EICZRUAF";
const vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const returnUrl = "https://khangtrandev.id.vn/payment/vnpay/return";

// 2. TẠO THAM SỐ
const date = new Date();
const createDate = 
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0") +
    String(date.getHours()).padStart(2, "0") +
    String(date.getMinutes()).padStart(2, "0") +
    String(date.getSeconds()).padStart(2, "0");

const orderId = "TEST_" + Math.floor(Math.random() * 100000);
const amount = 10000; // 10k VND

let vnp_Params = {};
vnp_Params["vnp_Version"] = "2.1.0";
vnp_Params["vnp_Command"] = "pay";
vnp_Params["vnp_TmnCode"] = tmnCode;
vnp_Params["vnp_Locale"] = "vn";
vnp_Params["vnp_CurrCode"] = "VND";
vnp_Params["vnp_TxnRef"] = orderId;
vnp_Params["vnp_OrderInfo"] = "ThanhToanTestKey";
vnp_Params["vnp_OrderType"] = "other";
vnp_Params["vnp_Amount"] = amount * 100;
vnp_Params["vnp_ReturnUrl"] = returnUrl;
vnp_Params["vnp_IpAddr"] = "27.64.219.94"; // User Real IP
vnp_Params["vnp_CreateDate"] = createDate;

// 3. SẮP XẾP VÀ TẠO CHỮ KÝ
const sortedKeys = Object.keys(vnp_Params).sort();
const signData = sortedKeys.map(key => `${key}=${vnp_Params[key]}`).join('&');

// SHA512 Hash
const hmac = crypto.createHmac("sha512", secretKey);
const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
vnp_Params["vnp_SecureHash"] = signed;

// 4. TẠO URL FINAL
const paymentUrl = vnpUrl + "?" + querystring.stringify(vnp_Params, null, null, { encodeURIComponent: querystring.escape });

console.log("Copy link dưới đây và dán vào trình duyệt:");
console.log("\n" + paymentUrl + "\n");
console.log("----------------------------------------");
