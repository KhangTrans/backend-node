const crypto = require('crypto');
const axios = require('axios');
const moment = require('moment');

const zalopayConfig = {
  app_id: process.env.ZALOPAY_APP_ID || '554',
  key1: process.env.ZALOPAY_KEY1,
  key2: process.env.ZALOPAY_KEY2,
  endpoint: process.env.ZALOPAY_ENDPOINT || 'https://sb-openapi.zalopay.vn/v2/create',

  callback_url: process.env.ZALOPAY_CALLBACK_URL || 'https://backend-node-5re9.onrender.com/api/payment/zalopay/callback'
};

/**
 * Tạo order ZaloPay
 */
async function createOrder(orderId, amount, orderInfo, items = []) {
  try {
    const transID = Math.floor(Math.random() * 1000000);
    const app_trans_id = `${moment().format('YYMMDD')}_${transID}`;

    const order = {
      app_id: zalopayConfig.app_id,
      app_trans_id: app_trans_id,
      app_user: 'user123',
      app_time: Date.now(),
      item: JSON.stringify(items),
      embed_data: JSON.stringify({
        redirecturl: process.env.ZALOPAY_RETURN_URL || 'https://khangtrandev.id.vn/payment/zalopay/return',
        orderId: orderId
      }),
      amount: amount,
      description: orderInfo,
      bank_code: '',
      callback_url: zalopayConfig.callback_url
    };

    // Create MAC
    const data = zalopayConfig.app_id + "|" + order.app_trans_id + "|" + order.app_user + "|" + order.amount + "|" + order.app_time + "|" + order.embed_data + "|" + order.item;
    order.mac = crypto.createHmac('sha256', zalopayConfig.key1).update(data).digest('hex');

    // Call API
    const response = await axios.post(zalopayConfig.endpoint, null, { params: order });

    console.log('ZaloPay create order response:', response.data);

    return {
      success: response.data.return_code === 1,
      order_url: response.data.order_url,
      zp_trans_token: response.data.zp_trans_token,
      app_trans_id: app_trans_id,
      ...response.data
    };
  } catch (error) {
    console.error('ZaloPay createOrder error:', error.message);
    throw error;
  }
}

/**
 * Verify callback từ ZaloPay
 */
function verifyCallback(dataStr, reqMac) {
  try {
    const mac = crypto.createHmac('sha256', zalopayConfig.key2).update(dataStr).digest('hex');
    console.log('ZaloPay verify - Generated MAC:', mac);
    console.log('ZaloPay verify - Received MAC:', reqMac);
    return mac === reqMac;
  } catch (error) {
    console.error('ZaloPay verifyCallback error:', error);
    return false;
  }
}

/**
 * Query order status
 */
async function queryOrder(app_trans_id) {
  try {
    const postData = {
      app_id: zalopayConfig.app_id,
      app_trans_id: app_trans_id
    };

    const data = postData.app_id + "|" + postData.app_trans_id + "|" + zalopayConfig.key1;
    postData.mac = crypto.createHmac('sha256', zalopayConfig.key1).update(data).digest('hex');

    const postConfig = {
      method: 'post',
      url: 'https://sb-openapi.zalopay.vn/v2/query',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: new URLSearchParams(postData).toString()
    };

    const response = await axios(postConfig);
    console.log('ZaloPay query response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('ZaloPay queryOrder error:', error.message);
    throw error;
  }
}

/**
 * Refund order
 */
async function refundOrder(zp_trans_id, amount, description) {
  try {
    const timestamp = Date.now();
    const uid = `${timestamp}${Math.floor(111 + Math.random() * 999)}`;

    const params = {
      app_id: zalopayConfig.app_id,
      m_refund_id: `${moment().format('YYMMDD')}_${zalopayConfig.app_id}_${timestamp}`,
      timestamp: timestamp,
      zp_trans_id: zp_trans_id,
      amount: amount,
      description: description
    };

    const data = params.app_id + "|" + params.zp_trans_id + "|" + params.amount + "|" + params.description + "|" + params.timestamp;
    params.mac = crypto.createHmac('sha256', zalopayConfig.key1).update(data).digest('hex');

    const response = await axios.post('https://sb-openapi.zalopay.vn/v2/refund', null, { params });

    console.log('ZaloPay refund response:', response.data);
    return response.data;
  } catch (error) {
    console.error('ZaloPay refundOrder error:', error.message);
    throw error;
  }
}

module.exports = {
  zalopayConfig,
  createOrder,
  verifyCallback,
  queryOrder,
  refundOrder
};
