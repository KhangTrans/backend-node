const crypto = require('crypto');
const querystring = require('querystring');

// Helper function to format date to yyyyMMddHHmmss
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

const vnpayConfig = {
  vnp_TmnCode: process.env.VNPAY_TMN_CODE,
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET,
  vnp_Url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  vnp_Api: process.env.VNPAY_API || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
  vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:5173/payment/vnpay/return'
};

/**
 * Sắp xếp object theo key
 */
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  
  return sorted;
}

/**
 * Tạo URL thanh toán VNPay
 */
function createPaymentUrl(orderId, amount, orderInfo, ipAddr, locale = 'vn') {
  try {
    if (!vnpayConfig.vnp_TmnCode || !vnpayConfig.vnp_HashSecret) {
      throw new Error("Missing VNPay configuration (vnp_TmnCode or vnp_HashSecret)");
    }

    // Use Vietnam Time (GMT+7) - Robust Method
    // 1. Get current UTC time
    // 2. Add 7 hours (in ms)
    // 3. Use getUTC* methods to extract the parts (pretending the shifted time is UTC)
    const t = new Date();
    const utcTime = t.getTime() + (t.getTimezoneOffset() * 60000);
    const vnTime = new Date(utcTime + (7 * 3600000));

    const yyyy = vnTime.getUTCFullYear();
    const mm = String(vnTime.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(vnTime.getUTCDate()).padStart(2, '0');
    const HH = String(vnTime.getUTCHours()).padStart(2, '0');
    const MM = String(vnTime.getUTCMinutes()).padStart(2, '0');
    const ss = String(vnTime.getUTCSeconds()).padStart(2, '0');
    const createDate = `${yyyy}${mm}${dd}${HH}${MM}${ss}`;
    
    // Ensure IP is valid or default to 127.0.0.1
    const validIp = (ipAddr && ipAddr.length > 6) ? ipAddr : '127.0.0.1';

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = vnpayConfig.vnp_TmnCode;
    vnp_Params['vnp_Locale'] = locale;
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId;
    // VNPay Sandbox sometimes expects spaces to be encoded as '+' in the hash, but '%20' in the URL.
    // However, the standard is: Hash EXACTLY what you send.
    // Let's force proper string cleaning.
    vnp_Params['vnp_OrderInfo'] = (orderInfo || 'Thanh toan don hang');
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = Math.floor(amount * 100);
    vnp_Params['vnp_ReturnUrl'] = vnpayConfig.vnp_ReturnUrl;
    vnp_Params['vnp_IpAddr'] = validIp;
    vnp_Params['vnp_CreateDate'] = createDate;

    // Filter out empty values
    Object.keys(vnp_Params).forEach(key => {
      if (vnp_Params[key] === null || vnp_Params[key] === undefined || vnp_Params[key] === '') {
        delete vnp_Params[key];
      }
    });

    // 1. Sort the object to prepare for URL creation
    vnp_Params = sortObject(vnp_Params);

    // 2. Create sign data string (Paranoid Mode)
    // VNPay requires keys to be sorted alphabetically
    // We explicitly sort keys again to be 100% sure
    const signData = Object.keys(vnp_Params)
      .sort()
      .map(key => `${key}=${vnp_Params[key]}`)
      .join('&');
    
    // Log for debugging
    console.log("-------------------- VNPAY DEBUG --------------------");
    console.log("TMN Code:", vnpayConfig.vnp_TmnCode);
    console.log("Secret Length:", vnpayConfig.vnp_HashSecret ? vnpayConfig.vnp_HashSecret.length : 0);
    console.log("TxnRef:", vnp_Params['vnp_TxnRef']);
    console.log("Amount:", vnp_Params['vnp_Amount']);
    console.log("CreateDate:", createDate);
    console.log("RAW SIGN DATA (Check this against VNPay Sandbox):");
    console.log(signData);
    console.log("-----------------------------------------------------");

    // 3. Hash
    const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
    vnp_Params['vnp_SecureHash'] = signed;

    // 4. Create Final URL
    // Use encodeURIComponent to ensure correct encoding for the browser
    const paymentUrl = vnpayConfig.vnp_Url + '?' + querystring.stringify(vnp_Params, null, null, { encodeURIComponent: querystring.escape });

    return paymentUrl;
  } catch (error) {
    console.error('VNPay createPaymentUrl error:', error);
    throw error;
  }
}

/**
 * Verify VNPay return/callback
 */
function verifyReturnUrl(vnp_Params) {
  try {
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    // Create query string for verification (MANUAL ITERATION for consistency)
    const signData = Object.keys(vnp_Params)
      .map(key => `${key}=${vnp_Params[key]}`)
      .join('&');
    
    const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    return secureHash === signed;
  } catch (error) {
    console.error('VNPay verifyReturnUrl error:', error);
    return false;
  }
}

/**
 * Query transaction status
 */
async function queryTransaction(orderId, transDate) {
  try {
    const date = new Date();
    const requestId = String(date.getHours()).padStart(2, '0') + String(date.getMinutes()).padStart(2, '0') + String(date.getSeconds()).padStart(2, '0');
    const createDate = formatDate(date);

    let vnp_Params = {};
    vnp_Params['vnp_RequestId'] = requestId;
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'querydr';
    vnp_Params['vnp_TmnCode'] = vnpayConfig.vnp_TmnCode;
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = 'Query transaction ' + orderId;
    vnp_Params['vnp_TransactionDate'] = transDate;
    vnp_Params['vnp_CreateDate'] = createDate;
    vnp_Params['vnp_IpAddr'] = '127.0.0.1';

    vnp_Params = sortObject(vnp_Params);

    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
    vnp_Params['vnp_SecureHash'] = signed;

    const queryUrl = vnpayConfig.vnp_Api + '?' + querystring.stringify(vnp_Params, { encode: false });

    // Implement HTTP request to query
    // Return transaction info
    return { vnp_Params, queryUrl };
  } catch (error) {
    console.error('VNPay queryTransaction error:', error);
    throw error;
  }
}

module.exports = {
  vnpayConfig,
  createPaymentUrl,
  verifyReturnUrl,
  queryTransaction,
  sortObject
};
