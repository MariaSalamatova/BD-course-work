const router = require('express').Router();
const controller = require('../controllers/delivery.controller');

router.get('/analytics/methods', controller.getPopularDelivery); 
router.get('/:id', controller.getDelivery);

module.exports = router;