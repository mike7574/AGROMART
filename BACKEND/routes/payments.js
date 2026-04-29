const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const paymentModel = require('../models/paymentModel');
const orderModel = require('../models/orderModel');
const mpesaService = require('../services/mpesaService');

/**
 * Payment Routes
 * Handles M-Pesa STK push, callbacks, and payment queries
 */

// ========================================
// STK PUSH - Initiate Payment
// ========================================
router.post('/initiate-stk', async (req, res) => {
  try {
    const { orderId, userId, phoneNumber, amount } = req.body;

    // Validate input
    if (!orderId || !phoneNumber || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: orderId, phoneNumber, amount'
      });
    }

    // Validate phone number
    const formattedPhone = mpesaService.formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Use format: +254712345678 or 0712345678'
      });
    }

    console.log(`📱 Initiating Payment for Order: ${orderId}`);

    // Check if order exists
    const order = await orderModel.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Generate payment ID
    const paymentId = uuidv4();
    const accountReference = `ORDER-${orderId}`;

    // Create payment record
    await paymentModel.createPayment({
      paymentId,
      orderId,
      userId: userId || null,
      amount,
      phoneNumber: formattedPhone,
      type: 'STK_PUSH',
      status: 'PENDING'
    });

    // Trigger M-Pesa STK Push
    const stkResult = await mpesaService.stkPush(
      formattedPhone,
      amount,
      orderId,
      accountReference
    );

    if (!stkResult.success) {
      // Update payment to failed
      await paymentModel.updatePaymentStatus(paymentId, 'FAILED');
      return res.status(400).json({
        success: false,
        error: stkResult.error
      });
    }

    // Update payment record with M-Pesa response
    await paymentModel.updatePaymentStatus(paymentId, 'PENDING', {
      requestId: stkResult.data.merchantRequestId
    });
    await paymentModel.updatePaymentRequestRefs(paymentId, {
      merchantRequestId: stkResult.data.merchantRequestId,
      checkoutRequestId: stkResult.data.checkoutRequestId,
      responseCode: stkResult.data.responseCode
    });

    // Update order workflow/payment state using allowed enum values
    await orderModel.updateOrderStatus(orderId, 'PROCESSING');
    await orderModel.updatePaymentStatus(orderId, 'PENDING');

    console.log(`✅ STK Push initiated successfully for Order: ${orderId}`);

    res.json({
      success: true,
      data: {
        paymentId,
        orderId,
        ...stkResult.data,
        message: 'STK prompt sent to phone. Enter your M-Pesa PIN to complete payment.'
      }
    });
  } catch (error) {
    console.error('Error initiating STK push:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// M-PESA CALLBACK - Handle Payment Response
// ========================================
router.post('/callback', async (req, res) => {
  try {
    console.log('📥 Received M-Pesa Callback');
    console.log('Callback Data:', JSON.stringify(req.body, null, 2));

    // Process callback
    const callbackResult = mpesaService.processCallback(req.body);

    // Extract order ID from transaction description
    const transactionDesc = req.body.Body?.stkCallback?.CallbackMetadata?.Item
      ?.find(item => item.Name === 'AccountReference')?.Value || '';
    
    const orderId = transactionDesc.replace('ORDER-', '');

    if (!orderId) {
      console.error('❌ Order ID not found in callback');
      return res.json({ success: false });
    }

    if (!callbackResult.success) {
      console.warn('⚠️  Payment processing failed:', callbackResult.description);
      const paymentId = await getPaymentIdByOrderId(orderId);
      if (paymentId) {
        await paymentModel.updatePaymentStatus(paymentId, 'FAILED');
      }
      await orderModel.updatePaymentStatus(orderId, 'FAILED');
      await orderModel.updateOrderStatus(orderId, 'PENDING');
      return res.json({
        resultCode: 0,
        resultDesc: 'Accepted'
      });
    }

    // Update payment status
    const paymentId = await getPaymentIdByOrderId(orderId);
    if (paymentId) {
      await paymentModel.updatePaymentStatus(paymentId, 'COMPLETED', {
        transactionId: callbackResult.data?.mpesaReceiptNumber,
        receiptNumber: callbackResult.data?.mpesaReceiptNumber
      });
    }

    // Mark both order and payment as completed
    await orderModel.updateOrderStatus(orderId, 'FULFILLED');
    await orderModel.updatePaymentStatus(orderId, 'COMPLETED');

    console.log(`✅ Payment completed for Order: ${orderId}`);

    // Return success to M-Pesa
    res.json({
      resultCode: 0,
      resultDesc: 'Accepted'
    });
  } catch (error) {
    console.error('Error processing callback:', error);
    res.json({
      resultCode: 1,
      resultDesc: 'Failed'
    });
  }
});

// ========================================
// TIMEOUT - Handle Timeout
// ========================================
router.post('/timeout', async (req, res) => {
  try {
    console.log('⏱️  M-Pesa Timeout Callback');
    console.log('Timeout Data:', JSON.stringify(req.body, null, 2));

    const checkoutRequestId = req.body?.Body?.stkCallback?.CheckoutRequestID;
    if (checkoutRequestId) {
      const payment = await paymentModel.getPaymentByCheckoutRequestId(checkoutRequestId);
      if (payment) {
        await paymentModel.updatePaymentStatus(payment.payment_id, 'FAILED');
        await orderModel.updatePaymentStatus(payment.order_id, 'FAILED');
        await orderModel.updateOrderStatus(payment.order_id, 'PENDING');
      }
    }

    res.json({
      resultCode: 0,
      resultDesc: 'Accepted'
    });
  } catch (error) {
    console.error('Error processing timeout:', error);
    res.json({
      resultCode: 1,
      resultDesc: 'Failed'
    });
  }
});

// ========================================
// QUERY PAYMENT STATUS
// ========================================
router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const payment = await paymentModel.getPaymentByOrderId(orderId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: {
        paymentId: payment.payment_id,
        orderId: payment.order_id,
        status: payment.status,
        amount: payment.amount,
        phoneNumber: payment.phone_number,
        transactionId: payment.mpesa_transaction_id,
        receiptNumber: payment.mpesa_receipt_number,
        createdAt: payment.created_at,
        updatedAt: payment.updated_at
      }
    });
  } catch (error) {
    console.error('Error querying payment status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// GET USER PAYMENT HISTORY
// ========================================
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const payments = await paymentModel.getUserPayments(userId);
    const summary = await paymentModel.getPaymentSummary(userId);

    res.json({
      success: true,
      data: {
        summary,
        payments: payments.map(p => ({
          paymentId: p.payment_id,
          orderId: p.order_id,
          status: p.status,
          amount: p.amount,
          phoneNumber: p.phone_number,
          transactionId: p.mpesa_transaction_id,
          receiptNumber: p.mpesa_receipt_number,
          createdAt: p.created_at,
          updatedAt: p.updated_at
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper: Get payment ID by order ID
async function getPaymentIdByOrderId(orderId) {
  const payment = await paymentModel.getPaymentByOrderId(orderId);
  return payment ? payment.payment_id : null;
}

module.exports = router;
