const express = require('express');
const router = express.Router();
const orderModel = require('../models/orderModel');

// ========================================
// ORDERS ENDPOINTS
// ========================================

// CREATE new order
router.post('/', async (req, res) => {
  try {
    const orderData = req.body;
    
    // Validate required fields
    if (!orderData.customerName || !orderData.mobile || !orderData.addressLine || !orderData.items || !Array.isArray(orderData.items)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: customerName, mobile, addressLine, items'
      });
    }
    
    const orderId = await orderModel.createOrder(orderData);
    
    res.status(201).json({
      success: true,
      data: {
        id: orderId,
        message: 'Order created successfully'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET orders by status
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const orders = await orderModel.getOrdersByStatus(status);
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET user's orders
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await orderModel.getUserOrders(userId);
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET all orders (admin)
router.get('/', async (req, res) => {
  try {
    const orders = await orderModel.getAllOrders();
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET order by ID
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderModel.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// UPDATE order status
router.patch('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    await orderModel.updateOrderStatus(orderId, status);
    
    res.json({
      success: true,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// UPDATE payment status
router.patch('/:orderId/payment-status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus } = req.body;
    
    if (!paymentStatus) {
      return res.status(400).json({
        success: false,
        error: 'Payment status is required'
      });
    }
    
    await orderModel.updatePaymentStatus(orderId, paymentStatus);
    
    res.json({
      success: true,
      message: 'Payment status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET orders by status
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const orders = await orderModel.getOrdersByStatus(status);
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
