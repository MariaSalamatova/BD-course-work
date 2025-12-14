const router = require('express').Router();
const controller = require('../controllers/payment.controller');

router.get('/:id', controller.getPayment);

module.exports = router;