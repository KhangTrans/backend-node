const fs = require('fs');
const path = require('path');
const os = require('os');

const envPath = path.join(__dirname, '.env');
const newConfig = {
  VNPAY_TMN_CODE: 'TWAPOHRH',
  VNPAY_HASH_SECRET: 'RT0UBKYFBJX8B56RH7WUJJO8EICZRUAF',
  VNPAY_URL: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  VNPAY_API: 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
  VNPAY_RETURN_URL: 'https://khangtrandev.id.vn/payment/vnpay/return'
};

try {
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  }

  const lines = content.split('\n');
  const updatedLines = [];
  const processedKeys = new Set();

  lines.forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      if (newConfig.hasOwnProperty(key)) {
        updatedLines.push(`${key}=${newConfig[key]}`);
        processedKeys.add(key);
      } else {
        updatedLines.push(line);
      }
    } else {
      updatedLines.push(line);
    }
  });

  // Append missing keys
  Object.keys(newConfig).forEach(key => {
    if (!processedKeys.has(key)) {
      updatedLines.push(`${key}=${newConfig[key]}`);
    }
  });

  fs.writeFileSync(envPath, updatedLines.join('\n'));
  console.log('Successfully updated .env file');

} catch (error) {
  console.error('Error updating .env:', error);
}
