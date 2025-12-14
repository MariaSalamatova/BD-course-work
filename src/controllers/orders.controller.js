const prisma = require('../prisma');

exports.createOrder = async (req, res) => {
  const {
    cart_id,
    delivery_method,
    delivery_address,
    payment_method,
    total_price,
    delivery_date
  } = req.body;

  try {
    const order = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          transaction_date: new Date(),
          payment_method,
          payment_status: 'pending'
        }
      });

      const delivery = await tx.delivery.create({
        data: {
          delivery_method,
          delivery_address,
          order_status: 'created'
        }
      });

      return tx.orders.create({
        data: {
          cart_id,
          delivery_date: new Date(delivery_date),
          total_price,
          order_status: 'created',
          payment_id: payment.payment_id,
          delivery_id: delivery.delivery_id
        }
      });
    });

    res.status(201).json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getOrderById = async (req, res) => {
  const id = Number(req.params.id);

  const order = await prisma.orders.findUnique({
    where: { order_id: id },
    include: { delivery: true, payment: true }
  });

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  res.json(order);
};

exports.cancelOrder = async (req, res) => {
  const id = Number(req.params.id);

  try {
    const order = await prisma.orders.update({
      where: { order_id: id },
      data: { order_status: 'cancelled' }
    });

    res.json(order);
  } catch {
    res.status(404).json({ message: 'Order not found' });
  }
};