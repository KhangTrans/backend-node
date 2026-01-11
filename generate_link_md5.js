const crypto = require("crypto");
const querystring = require("querystring");

console.log("----------------------------------------");
console.log("TEST LINK VNPAY - MD5 VERSION");
console.log("----------------------------------------");

const tmnCode = "TWAPOHRH";
const secretKey = "RT0UBKYFBJX8B56RH7WUJJO8EICZRUAF";
const vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const returnUrl = "https://khangtrandev.id.vn/payment/vnpay/return";

const date = new Date();
const createDate = 
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0") +
    String(date.getHours()).padStart(2, "0") +
    String(date.getMinutes()).padStart(2, "0") +
    String(date.getSeconds()).padStart(2, "0");

const orderId = "TEST_MD5_" + Math.floor(Math.random() * 100000);
const amount = 10000;

let vnp_Params = {};
vnp_Params["vnp_Version"] = "2.1.0";
vnp_Params["vnp_Command"] = "pay";
vnp_Params["vnp_TmnCode"] = tmnCode;
vnp_Params["vnp_Locale"] = "vn";
vnp_Params["vnp_CurrCode"] = "VND";
vnp_Params["vnp_TxnRef"] = orderId;
vnp_Params["vnp_OrderInfo"] = "ThanhToanMD5";
vnp_Params["vnp_OrderType"] = "other";
vnp_Params["vnp_Amount"] = amount * 100;
vnp_Params["vnp_ReturnUrl"] = returnUrl;
vnp_Params["vnp_IpAddr"] = "127.0.0.1";
vnp_Params["vnp_CreateDate"] = createDate;

const sortedKeys = Object.keys(vnp_Params).sort();
const signData = sortedKeys.map(key => `${key}=${vnp_Params[key]}`).join('&');

// MD5 Hash
const signed = crypto.createHash("md5").update(secretKey + signData).digest("hex");
// Note: VNPay MD5 often uses (secret + data) or (data + secret)? 
// NO, standard VNPay MD5 is actually secureHash = md5(secret + data) for Verify, but for creation...
// Wait, VNPay documentation for MD5 is tricky. Some versions use `md5(secret + rawData)`.
// Others use `md5(rawData + secret)`.
// BUT, `vnp_Version` 2.1.0 usually enforces HMAC-SHA512.
// If we use MD5, we might need vnp_Version 2.0.0?
// Let's try standard MD5 pattern: md5(secret + data)

vnp_Params["vnp_SecureHash"] = signed;
vnp_Params["vnp_SecureHashType"] = "MD5"; // Sometimes required

const paymentUrl = vnpUrl + "?" + querystring.stringify(vnp_Params, null, null, { encodeURIComponent: querystring.escape });

console.log("Copy link dưới đây và dán vào trình duyệt (MD5):");
console.log("\n" + paymentUrl + "\n");
console.log("----------------------------------------");
