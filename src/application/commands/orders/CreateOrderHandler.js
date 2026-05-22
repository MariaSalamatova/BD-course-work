const { NotFoundError } = require('../../../domain/errors/DomainError');

class CreateOrderHandler {
  /**
   * @param {import('../../../domain/factories/OrderFactory')} orderFactory
   * @param {import('../../../domain/repositories').IOrderRepository} orderRepository
   * @param {import('../../../domain/repositories').IUserRepository} userRepository
   */
  constructor(orderFactory, orderRepository, userRepository) {
    this.orderFactory = orderFactory;
    this.orderRepository = orderRepository;
    this.userRepository = userRepository;
  }

  /**
   * @param {import('./CreateOrderCommand')} command
   * @returns {Promise<number>} ID створеного замовлення
   */
  async handle(command) {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const order = await this.orderFactory.create({
      userId: command.userId,
      deliveryMethod: command.deliveryMethod,
      deliveryAddress: command.deliveryAddress,
      paymentMethod: command.paymentMethod,
      items: command.items,
    });

    const saved = await this.orderRepository.save(order);

    return saved.getId();
  }
}

module.exports = CreateOrderHandler;
