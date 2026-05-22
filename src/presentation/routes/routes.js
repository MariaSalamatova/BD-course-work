const express = require('express');

function createRoutes({ ordersController, authController, deliveryController, cartController, paymentController, authenticate }) {
  const router = express.Router();

  router.post('/auth/register', (req, res) => authController.register(req, res));
  router.post('/auth/login', (req, res) => authController.login(req, res));

  router.post('/orders', authenticate, (req, res) => ordersController.create(req, res));
  router.patch('/orders/:orderId/status', authenticate, (req, res) => ordersController.updateStatus(req, res));
  router.delete('/orders/:orderId', authenticate, (req, res) => ordersController.delete(req, res));
  router.get('/orders/user/:userId', authenticate, (req, res) => ordersController.getUserOrdersList(req, res));
  router.get('/orders/products/category/:categoryId', authenticate, (req, res) => ordersController.getByCategory(req, res));

  router.get('/delivery/analytics/methods', authenticate, (req, res) => deliveryController.getPopularMethods(req, res));
  router.get('/delivery/:id', authenticate, (req, res) => deliveryController.getById(req, res));

  router.get('/cart/:id', authenticate, (req, res) => cartController.getById(req, res));
  router.get('/payment/:id', authenticate, (req, res) => paymentController.getById(req, res));

  return router;
}

module.exports = createRoutes;
