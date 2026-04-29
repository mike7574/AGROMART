const pool = require('../config/database');

/**
 * Payment Model - Handles payment transactions
 */

// Create a payment transaction
async function createPayment(paymentData) {
  try {
    const connection = await pool.getConnection();
    const query = `
      INSERT INTO payments (
        payment_id, order_id, user_id, payment_reference, amount, phone_number, 
        transaction_type, status, mpesa_request_id, mpesa_response_code,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const values = [
      paymentData.paymentId,
      paymentData.orderId,
      paymentData.userId,
      paymentData.paymentId, // Use paymentId as payment_reference
      paymentData.amount,
      paymentData.phoneNumber,
      paymentData.type || 'STK_PUSH',
      paymentData.status || 'PENDING',
      paymentData.mpesaRequestId || null,
      paymentData.mpesaResponseCode || null
    ];

    await connection.query(query, values);
    connection.release();
    return true;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
}

// Get payment by ID
async function getPaymentById(paymentId) {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM payments WHERE payment_id = ?';
    const [payments] = await connection.query(query, [paymentId]);
    connection.release();
    
    return payments.length > 0 ? payments[0] : null;
  } catch (error) {
    console.error('Error fetching payment:', error);
    throw error;
  }
}

// Get payment by order ID
async function getPaymentByOrderId(orderId) {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1';
    const [payments] = await connection.query(query, [orderId]);
    connection.release();
    
    return payments.length > 0 ? payments[0] : null;
  } catch (error) {
    console.error('Error fetching payment by order:', error);
    throw error;
  }
}

async function getPaymentByCheckoutRequestId(checkoutRequestId) {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM payments WHERE checkout_request_id = ? ORDER BY created_at DESC LIMIT 1';
    const [payments] = await connection.query(query, [checkoutRequestId]);
    connection.release();

    return payments.length > 0 ? payments[0] : null;
  } catch (error) {
    console.error('Error fetching payment by checkout request ID:', error);
    throw error;
  }
}

// Update payment status
async function updatePaymentStatus(paymentId, status, mpesaData = {}) {
  try {
    const connection = await pool.getConnection();
    const query = `
      UPDATE payments 
      SET status = ?, 
          mpesa_transaction_id = ?, 
          mpesa_receipt_number = ?,
          receipt_number = ?,
          updated_at = NOW()
      WHERE payment_id = ?
    `;
    
    const values = [
      status,
      mpesaData.transactionId || null,
      mpesaData.receiptNumber || null,
      mpesaData.receiptNumber || null,
      paymentId
    ];

    await connection.query(query, values);
    connection.release();
    return true;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
}

async function updatePaymentRequestRefs(paymentId, refs = {}) {
  try {
    const connection = await pool.getConnection();
    const query = `
      UPDATE payments
      SET merchant_request_id = ?,
          checkout_request_id = ?,
          mpesa_response_code = ?,
          updated_at = NOW()
      WHERE payment_id = ?
    `;

    await connection.query(query, [
      refs.merchantRequestId || null,
      refs.checkoutRequestId || null,
      refs.responseCode || null,
      paymentId
    ]);
    connection.release();
    return true;
  } catch (error) {
    console.error('Error updating payment request refs:', error);
    throw error;
  }
}

// Get payments for user
async function getUserPayments(userId) {
  try {
    const connection = await pool.getConnection();
    const query = `
      SELECT * FROM payments 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;
    const [payments] = await connection.query(query, [userId]);
    connection.release();
    
    return payments;
  } catch (error) {
    console.error('Error fetching user payments:', error);
    throw error;
  }
}

// Get payment summary
async function getPaymentSummary(userId) {
  try {
    const connection = await pool.getConnection();
    const query = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END) as total_paid
      FROM payments 
      WHERE user_id = ?
    `;
    const [summary] = await connection.query(query, [userId]);
    connection.release();
    
    return summary[0] || {};
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    throw error;
  }
}

module.exports = {
  createPayment,
  getPaymentById,
  getPaymentByOrderId,
  getPaymentByCheckoutRequestId,
  updatePaymentStatus,
  updatePaymentRequestRefs,
  getUserPayments,
  getPaymentSummary
};
