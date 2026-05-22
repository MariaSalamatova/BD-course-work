const express = require('express');

function createRoutes({
  ordersController,
  authController,
  deliveryController,
  cartController,
  paymentController,
  authenticate,
}) {
  const router = express.Router();

  router.post('/auth/register', (req, res) => authController.register(req, res));
  router.post('/auth/login',    (req, res) => authController.login(req, res));

  router.post(  '/orders',                  authenticate, (req, res) => ordersController.createOrder(req, res));
  router.patch( '/orders/:id/status',       authenticate, (req, res) => ordersController.updateOrderStatus(req, res));
  router.delete('/orders/:id',              authenticate, (req, res) => ordersController.deleteOrder(req, res));

  router.get('/orders',                     authenticate, (req, res) => ordersController.getUserOrders(req, res));
  router.get('/products',                   authenticate, (req, res) => ordersController.getProductsByCategory(req, res));

  router.get('/delivery/analytics/methods', authenticate, (req, res) => deliveryController.getPopularMethods(req, res));
  router.get('/delivery/:id',               authenticate, (req, res) => deliveryController.getById(req, res));
  router.get('/cart/:id',                   authenticate, (req, res) => cartController.getById(req, res));
  router.get('/payment/:id',                authenticate, (req, res) => paymentController.getById(req, res));

  return router;
}

module.exports = createRoutes;
