const prisma = require('./prisma');

const PrismaOrderRepository = require('./infrastructure/repositories/PrismaOrderRepository');
const { PrismaUserRepository, PrismaProductRepository, PrismaDeliveryRepository } = require('./infrastructure/repositories/PrismaUserRepository');
const { BcryptPasswordHasher, JwtTokenService } = require('./infrastructure/services');

const OrderFactory = require('./domain/factories/OrderFactory');

const CreateOrderHandler = require('./application/commands/orders/CreateOrderHandler');
const UpdateOrderStatusHandler = require('./application/commands/orders/UpdateOrderStatusHandler');
const DeleteOrderHandler = require('./application/commands/orders/DeleteOrderHandler');

const { RegisterHandler, LoginHandler } = require('./application/commands/auth/AuthHandlers');

const { GetUserOrdersHandler } = require('./application/queries/orders/GetUserOrdersQuery');
const { GetProductsByCategoryHandler } = require('./application/queries/orders/GetProductsByCategoryQuery');

const OrdersController = require('./presentation/controllers/OrdersController');
const AuthController = require('./presentation/controllers/AuthController');

const orderRepository    = new PrismaOrderRepository(prisma);
const userRepository     = new PrismaUserRepository(prisma);
const productRepository  = new PrismaProductRepository(prisma);
const deliveryRepository = new PrismaDeliveryRepository(prisma);

const passwordHasher = new BcryptPasswordHasher();
const tokenService   = new JwtTokenService();

const orderFactory = new OrderFactory(productRepository);

const createOrderHandler       = new CreateOrderHandler(orderFactory, orderRepository, userRepository);
const updateOrderStatusHandler = new UpdateOrderStatusHandler(orderRepository);
const deleteOrderHandler       = new DeleteOrderHandler(orderRepository);
const registerHandler          = new RegisterHandler(userRepository, passwordHasher, tokenService);
const loginHandler             = new LoginHandler(userRepository, passwordHasher, tokenService);

const getUserOrdersHandler        = new GetUserOrdersHandler(orderRepository);
const getProductsByCategoryHandler = new GetProductsByCategoryHandler(productRepository);

const ordersController = new OrdersController({
  createOrderHandler,
  updateOrderStatusHandler,
  deleteOrderHandler,
  getUserOrdersHandler,
  getProductsByCategoryHandler,
});

const authController = new AuthController({
  registerHandler,
  loginHandler,
});

const deliveryController = {
  getById: async (req, res) => {
    const record = await deliveryRepository.findById(Number(req.params.id));
    if (!record) return res.status(404).json({ message: 'Delivery not found' });
    res.json(record);
  },
  getPopularMethods: async (req, res) => {
    try {
      const result = await deliveryRepository.getPopularMethods();
      res.json(result);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  },
};

const cartController = {
  getById: async (req, res) => {
    try {
      const cart = await prisma.cart.findUnique({
        where: { cart_id: Number(req.params.id) },
        include: { cartitems: { include: { product: true } } },
      });
      if (!cart) return res.status(404).json({ message: 'Cart not found' });
      res.json(cart);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  },
};

const paymentController = {
  getById: async (req, res) => {
    try {
      const payment = await prisma.payment.findUnique({
        where: { payment_id: Number(req.params.id) },
      });
      if (!payment) return res.status(404).json({ message: 'Payment not found' });
      res.json(payment);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  },
};

module.exports = {
  ordersController,
  authController,
  deliveryController,
  cartController,
  paymentController,
  tokenService,
};
