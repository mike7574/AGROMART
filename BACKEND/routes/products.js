const express = require('express');
const router = express.Router();
const productModel = require('../models/productModel');

// ========================================
// PRODUCTS ENDPOINTS
// ========================================

// GET all products
router.get('/', async (req, res) => {
  try {
    const products = await productModel.getAllProducts();
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET products by category
router.get('/category/:categoryName', async (req, res) => {
  try {
    const { categoryName } = req.params;
    const products = await productModel.getProductsByCategory(categoryName);
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// SEARCH products
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const products = await productModel.searchProducts(query);
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET product by ID
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await productModel.getProductById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// CREATE new product
router.post('/', async (req, res) => {
  try {
    const productData = req.body;
    const productId = await productModel.createProduct(productData);
    res.status(201).json({
      success: true,
      data: { id: productId }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// UPDATE existing product
router.put('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    await productModel.updateProduct(productId, req.body);
    res.json({
      success: true,
      message: 'Product updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// SOFT DELETE product
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    await productModel.softDeleteProduct(productId);
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
