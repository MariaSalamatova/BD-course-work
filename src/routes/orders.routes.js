const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/orders.controller');

router.post('/', ordersController.createOrderWithItems);
router.patch('/:orderId/status', ordersController.updateOrderStatus);
router.delete('/:orderId', ordersController.deleteCancelledOrder);
router.get('/user/:userId', ordersController.getUserOrders);

module.exports = router;