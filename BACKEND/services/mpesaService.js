const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

/**
 * M-Pesa Service
 * Handles all M-Pesa Sandbox API interactions
 */

const SAFARICOM_API = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke'
};

const API_URL = process.env.MPESA_ENVIRONMENT === 'production' 
  ? SAFARICOM_API.production 
  : SAFARICOM_API.sandbox;

function getEnv(name) {
  return (process.env[name] || '').trim();
}

// Generate access token
async function getAccessToken() {
  try {
    const auth = Buffer.from(
      `${getEnv('MPESA_CONSUMER_KEY')}:${getEnv('MPESA_CONSUMER_SECRET')}`
    ).toString('base64');

    const response = await axios.get(
      `${API_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ M-Pesa Access Token Generated');
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Error getting M-Pesa access token:', error.response?.data || error.message);
    throw new Error('Failed to get M-Pesa access token');
  }
}

// STK Push
async function stkPush(phoneNumber, amount, orderId, accountReference) {
  try {
    console.log(`📱 Processing STK Push for ${phoneNumber}, Amount: ${amount}, Order: ${orderId}`);

    const accessToken = await getAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(timestamp);

    // Validate phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      throw new Error('Invalid phone number');
    }

    const payload = {
      BusinessShortCode: getEnv('MPESA_SHORTCODE'),
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount), // Must be integer
      PartyA: formattedPhone,
      PartyB: getEnv('MPESA_SHORTCODE'),
      PhoneNumber: formattedPhone,
      CallBackURL: getEnv('MPESA_CALLBACK_URL'),
      TimeoutURL: getEnv('MPESA_TIMEOUT_URL'),
      AccountReference: accountReference || `ORDER-${orderId}`,
      TransactionDesc: `AGROMART Order ${orderId}`
    };

    console.log('📤 Sending STK Push request:', {
      ...payload,
      Password: '***'
    });

    const response = await axios.post(
      `${API_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ STK Push Response:', response.data);

    return {
      success: true,
      data: {
        merchantRequestId: response.data.MerchantRequestID,
        checkoutRequestId: response.data.CheckoutRequestID,
        responseCode: response.data.ResponseCode,
        responseDescription: response.data.ResponseDescription,
        customerMessage: response.data.CustomerMessage,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('❌ STK Push Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.errorMessage || error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Query STK Push Status
async function querySTKStatus(checkoutRequestId) {
  try {
    console.log(`🔍 Querying STK Status for: ${checkoutRequestId}`);

    const accessToken = await getAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(timestamp);

    const payload = {
      BusinessShortCode: getEnv('MPESA_SHORTCODE'),
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };

    const response = await axios.post(
      `${API_URL}/mpesa/stkpushquery/v1/query`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ STK Status Response:', response.data);

    return {
      success: true,
      data: {
        responseCode: response.data.ResponseCode,
        responseDescription: response.data.ResponseDescription,
        merchantRequestId: response.data.MerchantRequestID,
        checkoutRequestId: response.data.CheckoutRequestID,
        resultCode: response.data.ResultCode,
        resultDescription: response.data.ResultDesc
      }
    };
  } catch (error) {
    console.error('❌ STK Status Query Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.errorMessage || error.message
    };
  }
}

// Process callback response
async function processCallback(callbackData) {
  try {
    console.log('📥 Processing M-Pesa Callback');

    const result = callbackData.Body.stkCallback.CallbackMetadata?.Item || [];
    const resultCode = callbackData.Body.stkCallback.ResultCode;
    const resultDesc = callbackData.Body.stkCallback.ResultDesc;

    if (resultCode !== 0) {
      console.warn(`⚠️  Payment failed: ${resultDesc}`);
      return {
        success: false,
        status: 'FAILED',
        code: resultCode,
        description: resultDesc
      };
    }

    // Extract callback data
    const callbackMetadata = {};
    if (Array.isArray(result)) {
      result.forEach(item => {
        callbackMetadata[item.Name] = item.Value;
      });
    }

    console.log('✅ Payment successful - Callback metadata:', callbackMetadata);

    return {
      success: true,
      status: 'COMPLETED',
      data: {
        amount: callbackMetadata.Amount,
        mpesaReceiptNumber: callbackMetadata.MpesaReceiptNumber,
        transactionDate: callbackMetadata.TransactionDate,
        phoneNumber: callbackMetadata.PhoneNumber,
        resultCode: resultCode,
        resultDescription: resultDesc
      }
    };
  } catch (error) {
    console.error('❌ Callback Processing Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper: Generate timestamp
function generateTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${date}${hour}${minute}${second}`;
}

// Helper: Generate password
function generatePassword(timestamp) {
  const data = `${getEnv('MPESA_SHORTCODE')}${getEnv('MPESA_PASSKEY')}${timestamp}`;
  return Buffer.from(data).toString('base64');
}

// Helper: Format phone number (convert to 254XXXXXXXXX format)
function formatPhoneNumber(phoneNumber) {
  // Remove any spaces, dashes, +
  let phone = phoneNumber.replace(/[\s\-+]/g, '');

  // If starts with 0, replace with 254
  if (phone.startsWith('0')) {
    phone = '254' + phone.substring(1);
  }
  // If already has country code 254
  else if (!phone.startsWith('254')) {
    // Assume it's just the number
    phone = '254' + phone;
  }

  // Validate length (should be 12 digits: 254 + 9 digits)
  if (phone.length !== 12 || !phone.match(/^254\d{9}$/)) {
    console.warn(`Invalid phone number format: ${phone}`);
    return null;
  }

  return phone;
}

// Helper: Generate unique reference
function generatePaymentReference() {
  return `PAY-${uuidv4().substring(0, 8).toUpperCase()}`;
}

module.exports = {
  getAccessToken,
  stkPush,
  querySTKStatus,
  processCallback,
  generateTimestamp,
  generatePassword,
  formatPhoneNumber,
  generatePaymentReference
};
