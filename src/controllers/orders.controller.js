const v = require('valibot');
const prisma = require('../prisma');

// --- Схеми валідації (valibot) ---

const OrderItemSchema = v.object({
  product_id: v.pipe(v.number(), v.integer('product_id must be an integer'), v.minValue(1, 'product_id must be positive')),
  quantity: v.pipe(v.number(), v.integer('quantity must be an integer'), v.minValue(1, 'quantity must be a positive integer'))
});

const CreateOrderSchema = v.object({
  delivery_method: v.picklist(['courier', 'pickup', 'post'], 'Invalid delivery_method. Must be: courier, pickup, post'),
  delivery_address: v.pipe(v.string(), v.minLength(1, 'delivery_address cannot be empty')),
  payment_method: v.picklist(['card', 'cash', 'online'], 'Invalid payment_method. Must be: card, cash, online'),
  items: v.pipe(
    v.array(OrderItemSchema),
    v.minLength(1, 'Order must contain at least one item')
  )
});

const UpdateStatusSchema = v.object({
  newStatus: v.picklist(
    ['created', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    'Invalid newStatus. Must be: created, confirmed, shipped, delivered, cancelled'
  ),
  currentStatus: v.pipe(v.string(), v.minLength(1, 'currentStatus is required'))
});

// --- Контролери ---

exports.createOrderWithItems = async (req, res) => {
  const result = v.safeParse(CreateOrderSchema, req.body);

  if (!result.success) {
    return res.status(400).json({ message: result.issues[0].message });
  }

  const { delivery_method, delivery_address, payment_method, items } = result.output;
  const user_id = req.user.user_id;

  try {
    const order = await prisma.$transaction(async (tx) => {
      const user = await tx.users.findUnique({ where: { user_id } });
      if (!user) {
        const err = new Error('User not found');
        err.statusCode = 404;
        throw err;
      }

      const products = await tx.product.findMany({
        where: { product_id: { in: items.map(i => i.product_id) } }
      });

      if (products.length !== items.length) {
        const foundIds = products.map(p => p.product_id);
        const missingIds = items.map(i => i.product_id).filter(id => !foundIds.includes(id));
        const err = new Error(`Products not found: ${missingIds.join(', ')}`);
        err.statusCode = 404;
        throw err;
      }

      const cart = await tx.cart.create({ data: { user_id } });

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
          delivery_address: delivery_address.trim(),
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
          cart: { include: { cartitems: { include: { product: true } } } },
          delivery: true,
          payment: true
        }
      });
    });

    res.status(201).json(order);
  } catch (error) {
    const status = error.statusCode || 400;
    res.status(status).json({ message: 'Order creation failed', error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const result = v.safeParse(UpdateStatusSchema, req.body);

  if (!result.success) {
    return res.status(400).json({ message: result.issues[0].message });
  }

  const { newStatus, currentStatus } = result.output;

  try {
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.orders.findUnique({
        where: { order_id: Number(req.params.orderId) }
      });

      if (!order) {
        const err = new Error('Order not found');
        err.statusCode = 404;
        throw err;
      }

      if (order.order_status === 'cancelled') {
        const err = new Error('Cancelled order cannot be updated');
        err.statusCode = 409;
        throw err;
      }

      if (order.order_status !== currentStatus) {
        const err = new Error('Order status has changed. Please retry the operation.');
        err.statusCode = 409;
        throw err;
      }

      return tx.orders.update({
        where: { order_id: Number(req.params.orderId) },
        data: { order_status: newStatus }
      });
    });

    res.json(updatedOrder);
  } catch (error) {
    const status = error.statusCode || 409;
    res.status(status).json({ message: error.message });
  }
};

exports.deleteCancelledOrder = async (req, res) => {
  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.orders.findUnique({
        where: { order_id: Number(req.params.orderId) }
      });

      if (!order) {
        const err = new Error('Order not found');
        err.statusCode = 404;
        throw err;
      }

      if (order.order_status !== 'cancelled') {
        const err = new Error('Only cancelled orders can be deleted');
        err.statusCode = 400;
        throw err;
      }

      await tx.orders.delete({ where: { order_id: Number(req.params.orderId) } });
    });

    res.json({ message: 'Order permanently deleted (hard delete)' });
  } catch (error) {
    const status = error.statusCode || 400;
    res.status(status).json({ message: error.message });
  }
};

exports.getUserOrders = async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    const orders = await prisma.orders.findMany({
      where: { cart: { user_id: Number(userId) } },
      include: { delivery: true, payment: true },
      orderBy: { delivery_date: 'desc' },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit)
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

exports.getProductsByCategory = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const products = await prisma.product.findMany({
      where: {
        productcategoryconnection: {
          some: { category_id: Number(categoryId) }
        }
      },
      orderBy: { price: 'asc' }
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};