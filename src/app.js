const express = require('express');
const createRoutes = require('./presentation/routes/routes');
const authenticate = require('./presentation/middleware/auth.middleware');
const {
  ordersController, authController,
  deliveryController, cartController, paymentController
} = require('./container');

const app = express();
app.use(express.json());

app.use('/api', createRoutes({
  ordersController,
  authController,
  deliveryController,
  cartController,
  paymentController,
  authenticate
}));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;