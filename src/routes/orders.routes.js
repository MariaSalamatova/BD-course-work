const router = require('express').Router();
const controller = require('../controllers/orders.controller');

router.post('/', controller.createOrder);
router.get('/:id', controller.getOrderById);
router.put('/:id/cancel', controller.cancelOrder);

module.exports = router;