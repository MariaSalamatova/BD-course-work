const prisma = require('../prisma');

exports.createOrderWithItems = async (req, res) => {
  const {
    user_id,
    delivery_method,
    delivery_address,
    payment_method,
    items
  } = req.body;

  if (!user_id || !delivery_method || !delivery_address || !payment_method) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Order must contain items' });
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const user = await tx.users.findUnique({
        where: { user_id }
      });
      if (!user) throw new Error('User not found');

      const products = await tx.product.findMany({
        where: {
          product_id: { in: items.map(i => i.product_id) }
        }
      });

      if (products.length !== items.length) {
        throw new Error('One or more products not found');
      }

      for (const item of items) {
        if (item.quantity <= 0) {
          throw new Error('Invalid product quantity');
        }
      }

      const cart = await tx.cart.create({
        data: { user_id }
      });

      let total_price = 0;

      for (const item of items) {
        const product = products.find(p => p.product_id === item.product_id);

        await tx.cartitems.create({
          data: {
            cart_id: cart.cart_id,
            product_id: item.product_id,
            quantity: item.quantity
          }
        });

        total_price += Number(product.price) * item.quantity;
      }

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
          cart_id: cart.cart_id,
          delivery_date: new Date(),
          total_price,
          order_status: 'created',
          delivery_id: delivery.delivery_id,
          payment_id: payment.payment_id
        },
        include: {
          cart: {
            include: {
              cartitems: {
                include: { product: true }
              }
            }
          },
          delivery: true,
          payment: true
        }
      });
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({
      message: 'Order creation failed',
      error: error.message
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { newStatus, currentStatus } = req.body;

  if (!newStatus || !currentStatus) {
    return res.status(400).json({ message: 'Missing status fields' });
  }

  try {
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.orders.findUnique({
        where: { order_id: Number(orderId) }
      });

      if (!order) throw new Error('Order not found');

      if (order.order_status !== currentStatus) {
        throw new Error('Order status has changed. Retry operation.');
      }

      if (order.order_status === 'cancelled') {
        throw new Error('Cancelled order cannot be updated');
      }

      return tx.orders.update({
        where: { order_id: Number(orderId) },
        data: { order_status: newStatus }
      });
    });

    res.json(updatedOrder);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

exports.deleteCancelledOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.orders.findUnique({
        where: { order_id: Number(orderId) }
      });

      if (!order) throw new Error('Order not found');

      if (order.order_status !== 'cancelled') {
        throw new Error('Only cancelled orders can be deleted');
      }

      await tx.orders.delete({
        where: { order_id: Number(orderId) }
      });
    });

    res.json({ message: 'Order permanently deleted (hard delete)' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getUserOrders = async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const orders = await prisma.orders.findMany({
    where: {
      cart: { user_id: Number(userId) }
    },
    include: {
      delivery: true,
      payment: true
    },
    orderBy: {
      delivery_date: 'desc'
    },
    take: Number(limit),
    skip: (Number(page) - 1) * Number(limit)
  });

  res.json(orders);
};

exports.getProductsByCategory = async (req, res) => {
  const { categoryId } = req.params;

  const products = await prisma.product.findMany({
    where: {
      productcategoryconnection: {
        some: { category_id: Number(categoryId) }
      }
    },
    orderBy: { price: 'asc' }
  });

  res.json(products);
};