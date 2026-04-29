#!/usr/bin/env node

/**
 * Database Setup - Create Payments Table
 */

require('dotenv').config();
const pool = require('./config/database');

async function createPaymentsTable() {
  try {
    console.log('🔧 Setting up payments table...\n');

    const connection = await pool.getConnection();

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS payments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        payment_id VARCHAR(36) UNIQUE NOT NULL,
        order_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36),
        amount DECIMAL(10, 2) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        transaction_type VARCHAR(50) DEFAULT 'STK_PUSH',
        status ENUM('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED') DEFAULT 'PENDING',
        mpesa_request_id VARCHAR(100),
        mpesa_response_code VARCHAR(50),
        mpesa_transaction_id VARCHAR(100),
        mpesa_receipt_number VARCHAR(100),
        receipt_number VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_payment_id (payment_id),
        INDEX idx_order_id (order_id),
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_phone (phone_number),
        INDEX idx_created (created_at)
      )
    `;

    console.log('📝 Creating payments table...');
    await connection.query(createTableSQL);
    console.log('✅ Payments table created successfully!\n');

    // Verify table was created
    const [tables] = await connection.query('SHOW TABLES LIKE "payments"');
    if (tables.length > 0) {
      console.log('✅ Verification: Payments table exists\n');
    }

    // Show table structure
    const [columns] = await connection.query('DESC payments');
    console.log('📋 Table Structure:');
    console.log('   Columns:', columns.map(c => c.Field).join(', '));
    console.log('   Status:', 'Ready for payment transactions\n');

    connection.release();

    console.log('✨ Database setup complete!');
    console.log('   You can now run: node test-payment.js\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up payments table:', error.message);
    console.error('   Make sure:', error);
    process.exit(1);
  }
}

createPaymentsTable();
