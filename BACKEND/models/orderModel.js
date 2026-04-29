const pool = require('../config/database');

// ========================================
// ORDER QUERIES
// ========================================

// Create new order
async function createOrder(orderData) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const {
      userId,
      customerName,
      mobile,
      email,
      county,
      addressLine,
      notes,
      items,
      subtotal,
      deliveryFee = 0
    } = orderData;

    const totalAmount = subtotal + deliveryFee;
    // Generate a unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Insert order with order_number
    const orderQuery = `
      INSERT INTO orders 
      (order_number, user_id, customer_name, mobile, email, county, address_line, notes, subtotal, delivery_fee, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `;

    const [orderResult] = await connection.query(orderQuery, [
      orderNumber,
      userId || null,
      customerName,
      mobile,
      email || null,
      county,
      addressLine,
      notes || null,
      subtotal,
      deliveryFee,
      totalAmount
    ]);
    const orderId = orderResult.insertId;
    
    // Insert order items (include unit)
    const itemQuery = `
      INSERT INTO order_items (order_id, product_id, product_name, unit, quantity, unit_price)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    for (const item of items) {
      await connection.query(itemQuery, [
        orderId,
        item.productId,
        item.name,
        item.unit || 'unit',
        item.quantity,
        item.unitPrice
      ]);
    }
    
    await connection.commit();
    return orderId;
  } catch (error) {
    await connection.rollback();
    console.error('Error creating order:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Get order by ID with items
async function getOrderById(orderId) {
  try {
    const connection = await pool.getConnection();
    
    const orderQuery = `
      SELECT * FROM orders WHERE id = ?
    `;
    const [orders] = await connection.query(orderQuery, [orderId]);
    
    if (orders.length === 0) return null;
    
    const itemsQuery = `
      SELECT * FROM order_items WHERE order_id = ?
    `;
    const [items] = await connection.query(itemsQuery, [orderId]);
    
    connection.release();
    
    return {
      ...orders[0],
      lines: items
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
}

// Get user's orders
async function getUserOrders(userId) {
  try {
    const connection = await pool.getConnection();
    
    const query = `
      SELECT o.*, COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    
    const [orders] = await connection.query(query, [userId]);
    connection.release();
    
    return orders;
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
}

// Get all orders (admin)
async function getAllOrders() {
  try {
    const connection = await pool.getConnection();
    
    const query = `
      SELECT o.*, COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    
    const [orders] = await connection.query(query);
    connection.release();
    
    return orders;
  } catch (error) {
    console.error('Error fetching all orders:', error);
    throw error;
  }
}

// Update order status
async function updateOrderStatus(orderId, status) {
  try {
    const connection = await pool.getConnection();
    const query = 'UPDATE orders SET status = ? WHERE id = ?';
    await connection.query(query, [status, orderId]);
    connection.release();
    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

// Update payment status
async function updatePaymentStatus(orderId, paymentStatus) {
  try {
    const connection = await pool.getConnection();
    const query = 'UPDATE orders SET payment_status = ? WHERE id = ?';
    await connection.query(query, [paymentStatus, orderId]);
    connection.release();
    return true;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
}

// Get orders by status
async function getOrdersByStatus(status) {
  try {
    const connection = await pool.getConnection();
    const query = `
      SELECT o.*, COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    const [orders] = await connection.query(query, [status]);
    connection.release();
    return orders;
  } catch (error) {
    console.error('Error fetching orders by status:', error);
    throw error;
  }
}

module.exports = {
  createOrder,
  getOrderById,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  getOrdersByStatus
};
