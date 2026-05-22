const { NotFoundError } = require('../../domain/errors/DomainError');

class CreateOrderUseCase {
  /**
   * @param {import('../../domain/factories/OrderFactory')} orderFactory
   * @param {import('../../domain/repositories').IOrderRepository} orderRepository
   * @param {import('../../domain/repositories').IUserRepository} userRepository
   */
  constructor(orderFactory, orderRepository, userRepository) {
    this.orderFactory = orderFactory;
    this.orderRepository = orderRepository;
    this.userRepository = userRepository;
  }

  /**
   * @param {{ userId, deliveryMethod, deliveryAddress, paymentMethod, items[] }} dto
   * @returns {Promise<Order>}
   */
  async execute({ userId, deliveryMethod, deliveryAddress, paymentMethod, items }) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const order = await this.orderFactory.create({
      userId,
      deliveryMethod,
      deliveryAddress,
      paymentMethod,
      items
    });

    return this.orderRepository.save(order);
  }
}

module.exports = CreateOrderUseCase;
