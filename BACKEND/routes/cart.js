const express = require('express');
const router = express.Router();
const cartModel = require('../models/cartModel');

// ========================================
// CART ENDPOINTS
// ========================================

// GET user's cart
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await cartModel.getCart(userId);
    
    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ADD product to cart
router.post('/:userId/add', async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity = 1 } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }
    
    await cartModel.addToCart(userId, productId, quantity);
    
    res.status(201).json({
      success: true,
      message: 'Product added to cart'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// UPDATE cart item quantity
router.patch('/:userId/update', async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }
    
    if (quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Quantity is required'
      });
    }
    
    await cartModel.updateCartQuantity(userId, productId, quantity);
    
    res.json({
      success: true,
      message: 'Cart item updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// REMOVE product from cart
router.delete('/:userId/remove/:productId', async (req, res) => {
  try {
    const { userId, productId } = req.params;
    
    await cartModel.removeFromCart(userId, productId);
    
    res.json({
      success: true,
      message: 'Product removed from cart'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// CLEAR cart
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    await cartModel.clearCart(userId);
    
    res.json({
      success: true,
      message: 'Cart cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET cart count
router.get('/:userId/count', async (req, res) => {
  try {
    const { userId } = req.params;
    const count = await cartModel.getCartCount(userId);
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
