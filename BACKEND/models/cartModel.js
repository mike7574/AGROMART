const pool = require('../config/database');

// ========================================
// CART QUERIES
// ========================================

// Add product to cart
async function addToCart(userId, productId, quantity = 1) {
  try {
    const connection = await pool.getConnection();
    
    // Check if product already in cart
    const selectQuery = 'SELECT quantity FROM cart WHERE user_id = ? AND product_id = ?';
    const [existing] = await connection.query(selectQuery, [userId, productId]);
    
    if (existing.length > 0) {
      // Update quantity
      const updateQuery = `
        UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?
      `;
      await connection.query(updateQuery, [quantity, userId, productId]);
    } else {
      // Insert new cart item
      const insertQuery = `
        INSERT INTO cart (user_id, product_id, quantity)
        VALUES (?, ?, ?)
      `;
      await connection.query(insertQuery, [userId, productId, quantity]);
    }
    
    connection.release();
    return true;
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

// Get user's cart
async function getCart(userId) {
  try {
    const connection = await pool.getConnection();
    
    const query = `
      SELECT 
        c.id,
        c.product_id,
        c.quantity,
        p.name,
        p.current_price as unit_price,
        pi.image_url as image,
        CONCAT('/product.html?id=', p.id) as product_url
      FROM cart c
      JOIN products p ON c.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND (pi.is_primary = 1 OR pi.sort_order = 0)
      WHERE c.user_id = ?
      ORDER BY c.added_at DESC
    `;
    
    const [items] = await connection.query(query, [userId]);
    connection.release();
    
    return items;
  } catch (error) {
    console.error('Error fetching cart:', error);
    throw error;
  }
}

// Update cart item quantity
async function updateCartQuantity(userId, productId, quantity) {
  try {
    const connection = await pool.getConnection();
    
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      const query = 'DELETE FROM cart WHERE user_id = ? AND product_id = ?';
      await connection.query(query, [userId, productId]);
    } else {
      const query = 'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?';
      await connection.query(query, [quantity, userId, productId]);
    }
    
    connection.release();
    return true;
  } catch (error) {
    console.error('Error updating cart quantity:', error);
    throw error;
  }
}

// Remove from cart
async function removeFromCart(userId, productId) {
  try {
    const connection = await pool.getConnection();
    const query = 'DELETE FROM cart WHERE user_id = ? AND product_id = ?';
    await connection.query(query, [userId, productId]);
    connection.release();
    return true;
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
}

// Clear cart
async function clearCart(userId) {
  try {
    const connection = await pool.getConnection();
    const query = 'DELETE FROM cart WHERE user_id = ?';
    await connection.query(query, [userId]);
    connection.release();
    return true;
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
}

// Get cart count
async function getCartCount(userId) {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT COUNT(*) as count FROM cart WHERE user_id = ?';
    const [result] = await connection.query(query, [userId]);
    connection.release();
    return result[0].count;
  } catch (error) {
    console.error('Error getting cart count:', error);
    return 0;
  }
}

module.exports = {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  getCartCount
};
