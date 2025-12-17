const express = require('express');

const ordersRoutes = require('./routes/orders.routes');
const deliveryRoutes = require('./routes/delivery.routes');
const paymentRoutes = require('./routes/payment.routes');
const cartRoutes = require('./routes/cart.routes');

const app = express();

app.use(express.json());

app.use('/api/orders', ordersRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/cart', cartRoutes);

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