const express = require('express');
const router = express.Router();
const wishlistModel = require('../models/wishlistModel');

// ========================================
// WISHLIST ENDPOINTS
// ========================================

// GET user's wishlist
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const wishlist = await wishlistModel.getWishlist(userId);
    
    res.json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ADD product to wishlist
router.post('/:userId/add', async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }
    
    await wishlistModel.addToWishlist(userId, productId);
    
    res.status(201).json({
      success: true,
      message: 'Product added to wishlist'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// REMOVE product from wishlist
router.delete('/:userId/remove/:productId', async (req, res) => {
  try {
    const { userId, productId } = req.params;
    
    await wishlistModel.removeFromWishlist(userId, productId);
    
    res.json({
      success: true,
      message: 'Product removed from wishlist'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// CHECK if product in wishlist
router.get('/:userId/has/:productId', async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const exists = await wishlistModel.isInWishlist(userId, productId);
    
    res.json({
      success: true,
      data: { exists }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET wishlist count
router.get('/:userId/count', async (req, res) => {
  try {
    const { userId } = req.params;
    const count = await wishlistModel.getWishlistCount(userId);
    
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

// CLEAR wishlist
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    await wishlistModel.clearWishlist(userId);
    
    res.json({
      success: true,
      message: 'Wishlist cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
