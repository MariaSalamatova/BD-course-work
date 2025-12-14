const router = require('express').Router();
const controller = require('../controllers/cart.controller');

router.get('/:id', controller.getCart);
module.exports = router;