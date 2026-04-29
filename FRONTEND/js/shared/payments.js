/**
 * M-Pesa Payment API Client
 * Handles payment transactions and M-Pesa integration
 */

import { apiCall } from './api.js';

export const paymentsAPI = {
  /**
   * Initiate STK Push payment
   * @param {string} orderId - Order ID
   * @param {string} phoneNumber - Customer phone number (0712345678 or +254712345678)
   * @param {number} amount - Payment amount in KES
   * @param {string} userId - Optional user ID
   * @returns {Promise<Object>} Payment response with payment ID and STK result
   */
  async initiateStkPush(orderId, phoneNumber, amount, userId = null) {
    console.log(`💳 Initiating M-Pesa STK Push for Order: ${orderId}`);
    
    const result = await apiCall('/payments/initiate-stk', {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        phoneNumber,
        amount,
        userId
      })
    });

    return result;
  },

  /**
   * Check payment status
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Payment status and details
   */
  async checkPaymentStatus(orderId) {
    console.log(`🔍 Checking payment status for Order: ${orderId}`);
    
    const result = await apiCall(`/payments/status/${orderId}`);
    return result;
  },

  /**
   * Get user payment history
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Payment history and summary
   */
  async getPaymentHistory(userId) {
    console.log(`📋 Fetching payment history for User: ${userId}`);
    
    const result = await apiCall(`/payments/history/${userId}`);
    return result;
  },

  /**
   * Poll payment status (useful for checking if payment was completed)
   * @param {string} orderId - Order ID
   * @param {number} maxAttempts - Maximum polling attempts (default: 30, ~1.5 mins with 3s interval)
   * @param {number} interval - Polling interval in ms ( default: 3000)
   * @returns {Promise<Object>} Final payment status
   */
  async pollPaymentStatus(orderId, maxAttempts = 30, interval = 3000) {
    console.log(`⏳ Polling payment status for Order: ${orderId}`);
    
    let attempts = 0;
    
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          attempts++;
          const status = await this.checkPaymentStatus(orderId);
          
          console.log(`[${attempts}/${maxAttempts}] Payment status: ${status.data?.status}`);
          
          // Check if payment is completed
          if (status.success && status.data?.status === 'COMPLETED') {
            console.log('✅ Payment completed!');
            resolve(status);
            return;
          }
          
          // Check if max attempts reached
          if (attempts >= maxAttempts) {
            console.warn('⏱️  Max polling attempts reached');
            resolve(status); // Return last status
            return;
          }
          
          // Continue polling
          setTimeout(poll, interval);
        } catch (error) {
          console.error('Error polling payment status:', error);
          reject(error);
        }
      };
      
      poll();
    });
  }
};

export default paymentsAPI;
