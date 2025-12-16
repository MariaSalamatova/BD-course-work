const router = require('express').Router();
const controller = require('../controllers/delivery.controller');

router.get('/:id', controller.getDelivery);
router.get('/analytics/methods', deliveryController.getPopularDelivery);

module.exports = router;