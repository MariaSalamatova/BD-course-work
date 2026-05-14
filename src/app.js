const express = require('express');

const ordersRoutes = require('./routes/orders.routes');
const deliveryRoutes = require('./routes/delivery.routes');
const paymentRoutes = require('./routes/payment.routes');
const cartRoutes = require('./routes/cart.routes');
const authRoutes = require('./routes/auth.routes');
const authenticate = require('./middleware/auth.middleware');

const app = express();

app.use(express.json());

app.use('/api/auth', authRoutes);

app.use('/api/orders', authenticate, ordersRoutes);
app.use('/api/delivery', authenticate, deliveryRoutes);
app.use('/api/payment', authenticate, paymentRoutes);
app.use('/api/cart', authenticate, cartRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;