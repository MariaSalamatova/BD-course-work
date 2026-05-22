const prisma = require('./prisma');

const PrismaOrderRepository = require('./infrastructure/repositories/PrismaOrderRepository');
const { PrismaUserRepository, PrismaProductRepository, PrismaDeliveryRepository } = require('./infrastructure/repositories/PrismaUserRepository');
const { BcryptPasswordHasher, JwtTokenService } = require('./infrastructure/services');

const OrderFactory = require('./domain/factories/OrderFactory');

const CreateOrderUseCase = require('./application/orders/CreateOrderUseCase');
const UpdateOrderStatusUseCase = require('./application/orders/UpdateOrderStatusUseCase');
const { DeleteOrderUseCase, GetUserOrdersUseCase, GetProductsByCategoryUseCase } = require('./application/orders/index');
const { RegisterUseCase, LoginUseCase } = require('./application/auth/index');

const OrdersController = require('./presentation/controllers/OrdersController');
const AuthController = require('./presentation/controllers/AuthController');

const orderRepository = new PrismaOrderRepository(prisma);
const userRepository = new PrismaUserRepository(prisma);
const productRepository = new PrismaProductRepository(prisma);
const deliveryRepository = new PrismaDeliveryRepository(prisma);
const passwordHasher = new BcryptPasswordHasher();
const tokenService = new JwtTokenService();

const orderFactory = new OrderFactory(productRepository);

const createOrder = new CreateOrderUseCase(orderFactory, orderRepository, userRepository);
const updateOrderStatus = new UpdateOrderStatusUseCase(orderRepository);
const deleteOrder = new DeleteOrderUseCase(orderRepository);
const getUserOrders = new GetUserOrdersUseCase(orderRepository);
const getProductsByCategory = new GetProductsByCategoryUseCase(productRepository);
const registerUseCase = new RegisterUseCase(userRepository, passwordHasher, tokenService);
const loginUseCase = new LoginUseCase(userRepository, passwordHasher, tokenService);

const ordersController = new OrdersController({
  createOrder, updateOrderStatus, deleteOrder, getUserOrders, getProductsByCategory
});
const authController = new AuthController({ registerUseCase, loginUseCase });

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
  }
};

const cartController = {
  getById: async (req, res) => {
    try {
      const cart = await prisma.cart.findUnique({
        where: { cart_id: Number(req.params.id) },
        include: { cartitems: { include: { product: true } } }
      });
      if (!cart) return res.status(404).json({ message: 'Cart not found' });
      res.json(cart);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
};

const paymentController = {
  getById: async (req, res) => {
    try {
      const payment = await prisma.payment.findUnique({ where: { payment_id: Number(req.params.id) } });
      if (!payment) return res.status(404).json({ message: 'Payment not found' });
      res.json(payment);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
};

module.exports = {
  ordersController, authController,
  deliveryController, cartController, paymentController,
  tokenService
};
