const pool = require('../config/database');

// ========================================
// WISHLIST QUERIES
// ========================================

// Add product to wishlist
async function addToWishlist(userId, productId) {
  try {
    const connection = await pool.getConnection();
    
    const query = `
      INSERT INTO wishlist (user_id, product_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE added_at = CURRENT_TIMESTAMP
    `;
    
    await connection.query(query, [userId, productId]);
    connection.release();
    return true;
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    throw error;
  }
}

// Get user's wishlist
async function getWishlist(userId) {
  try {
    const connection = await pool.getConnection();
    
    const query = `
      SELECT 
        w.id,
        w.product_id,
        w.added_at,
        p.name,
        p.description,
        p.current_price,
        p.original_price,
        p.stock,
        pi.image_url as image,
        CONCAT('/product.html?id=', p.id) as product_url
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND (pi.is_primary = 1 OR pi.sort_order = 0)
      WHERE w.user_id = ?
      ORDER BY w.added_at DESC
    `;
    
    const [items] = await connection.query(query, [userId]);
    connection.release();
    
    return items;
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    throw error;
  }
}

// Check if product in wishlist
async function isInWishlist(userId, productId) {
  try {
    const connection = await pool.getConnection();
    
    const query = 'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?';
    const [result] = await connection.query(query, [userId, productId]);
    connection.release();
    
    return result.length > 0;
  } catch (error) {
    console.error('Error checking wishlist:', error);
    return false;
  }
}

// Remove from wishlist
async function removeFromWishlist(userId, productId) {
  try {
    const connection = await pool.getConnection();
    const query = 'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?';
    await connection.query(query, [userId, productId]);
    connection.release();
    return true;
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    throw error;
  }
}

// Get wishlist count
async function getWishlistCount(userId) {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT COUNT(*) as count FROM wishlist WHERE user_id = ?';
    const [result] = await connection.query(query, [userId]);
    connection.release();
    return result[0].count;
  } catch (error) {
    console.error('Error getting wishlist count:', error);
    return 0;
  }
}

// Clear wishlist
async function clearWishlist(userId) {
  try {
    const connection = await pool.getConnection();
    const query = 'DELETE FROM wishlist WHERE user_id = ?';
    await connection.query(query, [userId]);
    connection.release();
    return true;
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    throw error;
  }
}

module.exports = {
  addToWishlist,
  getWishlist,
  isInWishlist,
  removeFromWishlist,
  getWishlistCount,
  clearWishlist
};
