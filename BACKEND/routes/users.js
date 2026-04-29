const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

// ========================================
// USERS ENDPOINTS
// ========================================

// REGISTER new user
router.post('/register', async (req, res) => {
  try {
    const { email, fullName, password } = req.body;
    
    if (!email || !fullName || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email, fullName, and password are required'
      });
    }
    
    // Check if user exists
    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }
    
    // Hash password
    const passwordHash = await userModel.hashPassword(password);
    
    // Create user
    const userId = await userModel.createUser(email, fullName, passwordHash);
    
    res.status(201).json({
      success: true,
      data: {
        id: userId,
        email,
        fullName
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// LOGIN user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    // Get user
    const user = await userModel.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Verify password
    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    const isPasswordValid = await userModel.verifyPassword(user.password_hash, password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET user by ID
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await userModel.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        isDemo: user.is_demo
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// UPDATE user
router.patch('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, phone } = req.body;
    
    const updateData = {};
    if (fullName) updateData.full_name = fullName;
    if (phone) updateData.phone = phone;
    
    await userModel.updateUser(userId, updateData);
    
    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// CREATE demo user
router.post('/demo/create', async (req, res) => {
  try {
    const { email, fullName } = req.body;
    
    if (!email || !fullName) {
      return res.status(400).json({
        success: false,
        error: 'Email and fullName are required'
      });
    }
    
    // Check if user exists
    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }
    
    const userId = await userModel.createUser(email, fullName, null, true);
    
    const token = jwt.sign(
      { id: userId, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      data: {
        id: userId,
        email,
        fullName,
        token,
        isDemo: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
