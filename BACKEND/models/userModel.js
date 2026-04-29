const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// ========================================
// USER QUERIES
// ========================================

// Create new user
async function createUser(email, fullName, passwordHash = null, isDemo = false) {
  try {
    const connection = await pool.getConnection();
    const query = `
      INSERT INTO users (email, password_hash, full_name, is_demo)
      VALUES (?, ?, ?, ?)
    `;
    
    const [result] = await connection.query(query, [email, passwordHash, fullName, isDemo]);
    connection.release();
    
    return result.insertId;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// Get user by email
async function getUserByEmail(email) {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM users WHERE email = ?';
    const [users] = await connection.query(query, [email]);
    connection.release();
    
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw error;
  }
}

// Get user by ID
async function getUserById(userId) {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM users WHERE id = ?';
    const [users] = await connection.query(query, [userId]);
    connection.release();
    
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw error;
  }
}

// Update user
async function updateUser(userId, updateData) {
  try {
    const connection = await pool.getConnection();
    const setClause = Object.keys(updateData)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(updateData), userId];
    
    const query = `UPDATE users SET ${setClause} WHERE id = ?`;
    await connection.query(query, values);
    connection.release();
    
    return true;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

// Verify password
async function verifyPassword(passwordHash, plainPassword) {
  try {
    return await bcrypt.compare(plainPassword, passwordHash);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

// Hash password
async function hashPassword(plainPassword) {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(plainPassword, salt);
  } catch (error) {
    console.error('Error hashing password:', error);
    throw error;
  }
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  verifyPassword,
  hashPassword
};
