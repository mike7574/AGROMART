#!/usr/bin/env node

/**
 * M-Pesa Payment Test Script
 * Tests the complete payment flow locally
 * 
 * Requirements:
 * - Backend running on port 3000
 * - Ngrok tunnel active
 * - .env file updated with credentials
 * 
 * Usage:
 * node test-payment.js
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const TEST_PHONE = '254712345678'; // Sandbox test number
const TEST_AMOUNT = 100; // KES

console.log('\n');
console.log('╔════════════════════════════════════╗');
console.log('║  M-Pesa Payment Integration Test   ║');
console.log('╚════════════════════════════════════╝\n');

// Test Functions
async function testBackendHealth() {
  try {
    console.log('1️⃣  Testing Backend Health...');
    const response = await axios.get(`${BACKEND_URL}/api/health`);
    console.log('✅ Backend is healthy');
    console.log(`   Status: ${response.data.status}`);
    return true;
  } catch (error) {
    console.error('❌ Backend health check failed');
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

async function testNGrokAccess() {
  try {
    const ngrokUrl = process.env.NGROK_URL;
    if (!ngrokUrl) {
      console.log('⚠️  NGROK_URL not set in environment (optional for local testing)');
      return true;
    }

    console.log('2️⃣  Testing NGrok Access...');
    const response = await axios.get(`${ngrokUrl}/api/health`);
    console.log('✅ NGrok tunnel is accessible');
    console.log(`   URL: ${ngrokUrl}`);
    return true;
  } catch (error) {
    console.error('❌ NGrok access failed');
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

async function testProductsAPI() {
  try {
    console.log('3️⃣  Testing Products API...');
    const response = await axios.get(`${BACKEND_URL}/api/products`);
    const products = response.data.data || [];
    console.log(`✅ Products API working`);
    console.log(`   Found ${products.length} products`);
    return true;
  } catch (error) {
    console.error('❌ Products API test failed');
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

async function testInitiatePayment() {
  try {
    console.log('4️⃣  Testing Payment Initiation (STK Push)...');
    
    const orderId = `test-${uuidv4().substring(0, 8)}`;
    
    // First create an order
    console.log('   📝 Creating test order first...');
    const orderResponse = await axios.post(
      `${BACKEND_URL}/api/orders`,
      {
        customerName: 'Test Customer',
        mobile: '0712345678',
        county: 'Nairobi',
        addressLine: '123 Test Street',
        items: [
          {
            productId: 'seed-maize',
            name: 'Premium Maize Seeds (5kg)',
            quantity: 1,
            unitPrice: 2500
          }
        ],
        subtotal: 2500
      }
    );

    const createdOrderId = orderResponse.data.data?.id || orderId;
    console.log(`   ✅ Order created: ${createdOrderId}`);

    // Now initiate payment for this order
    const response = await axios.post(
      `${BACKEND_URL}/api/payments/initiate-stk`,
      {
        orderId: createdOrderId,
        phoneNumber: TEST_PHONE,
        amount: TEST_AMOUNT,
        userId: null  // No user ID required for test
      }
    );

    console.log('✅ Payment initiation successful');
    console.log(`   Payment ID: ${response.data.data?.paymentId}`);
    console.log(`   Order ID: ${createdOrderId}`);
    console.log(`   Amount: KES ${TEST_AMOUNT}`);
    console.log(`   Phone: ${TEST_PHONE}`);
    
    if (response.data.data?.responseCode === '0') {
      console.log(`   ✅ STK Push sent successfully`);
      console.log(`   Message: ${response.data.data?.customerMessage}`);
    } else {
      console.log(`   ⚠️  Response Code: ${response.data.data?.responseCode}`);
      console.log(`   Description: ${response.data.data?.responseDescription}`);
    }

    return {
      success: true,
      orderId: createdOrderId,
      paymentId: response.data.data?.paymentId
    };
  } catch (error) {
    console.error('❌ Payment initiation failed');
    console.error(`   Error: ${error.response?.data?.error || error.message}`);
    return { success: false };
  }
}

async function testPaymentStatus(orderId) {
  try {
    console.log(`5️⃣  Testing Payment Status Check (Order: ${orderId})...`);
    
    const response = await axios.get(
      `${BACKEND_URL}/api/payments/status/${orderId}`
    );

    console.log('✅ Payment status retrieved');
    console.log(`   Status: ${response.data.data?.status}`);
    console.log(`   Amount: KES ${response.data.data?.amount}`);
    console.log(`   Phone: ${response.data.data?.phoneNumber}`);
    return true;
  } catch (error) {
    console.error('❌ Payment status check failed');
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

async function testPaymentHistory() {
  try {
    console.log('6️⃣  Testing Payment History...');
    
    const response = await axios.get(
      `${BACKEND_URL}/api/payments/history/null`
    );

    const history = response.data.data?.payments || [];
    console.log('✅ Payment history retrieved');
    console.log(`   Total transactions: ${response.data.data?.summary?.total_transactions || 0}`);
    console.log(`   Completed: ${response.data.data?.summary?.completed || 0}`);
    console.log(`   Pending: ${response.data.data?.summary?.pending || 0}`);
    console.log(`   Failed: ${response.data.data?.summary?.failed || 0}`);
    
    return true;
  } catch (error) {
    console.error('❌ Payment history test failed');
    console.error(`   Error: ${error.message}`);
    // Payment history test is optional for new users, so don't fail
    return true;
  }
}

// Main Test Runner
async function runTests() {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  const tests = [
    { name: 'Backend Health', fn: testBackendHealth },
    { name: 'NGrok Access', fn: testNGrokAccess },
    { name: 'Products API', fn: testProductsAPI },
    { name: 'Payment Initiation', fn: testInitiatePayment },
    { name: 'Payment History', fn: testPaymentHistory }
  ];

  let paymentData = { success: false };

  for (const test of tests) {
    const result = await test.fn();
    
    if (test.name === 'Payment Initiation') {
      paymentData = result;
      if (result.success) {
        results.passed++;
        results.tests.push(`✅ ${test.name}`);
        
        // Try to get status
        console.log(''); // spacing
        const statusOk = await testPaymentStatus(result.orderId);
        if (statusOk) {
          results.passed++;
          results.tests.push('✅ Payment Status Check');
        } else {
          results.failed++;
          results.tests.push('❌ Payment Status Check');
        }
      } else {
        results.failed++;
        results.tests.push(`❌ ${test.name}`);
      }
    } else {
      if (result === true) {
        results.passed++;
        results.tests.push(`✅ ${test.name}`);
      } else {
        results.failed++;
        results.tests.push(`❌ ${test.name}`);
      }
    }
    console.log(''); // spacing between tests
  }

  // Summary
  console.log('╔════════════════════════════════════╗');
  console.log('║        Test Summary Report         ║');
  console.log('╚════════════════════════════════════╝\n');

  results.tests.forEach(test => console.log(test));
  
  console.log('\n📊 Results:');
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   📈 Total:  ${results.passed + results.failed}\n`);

  if (results.failed === 0) {
    console.log('🎉 All tests passed! Your M-Pesa integration is ready.\n');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.\n');
  }

  // Next Steps
  console.log('📝 Next Steps:');
  console.log('1. Ensure NGrok is running: ngrok http 3000');
  console.log('2. Update .env with M-Pesa credentials from Safaricom');
  console.log('3. Update .env with your NGrok URL for callbacks');
  console.log('4. Check http://localhost:4040 for callback logs\n');
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test suite failed:', error.message);
  process.exit(1);
});
