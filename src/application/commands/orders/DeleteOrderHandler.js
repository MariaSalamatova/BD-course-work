const { NotFoundError, ValidationError } = require('../../../domain/errors/DomainError');

class DeleteOrderHandler {
  /**
   * @param {import('../../../domain/repositories').IOrderRepository} orderRepository
   */
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  /**
   * @param {import('./DeleteOrderCommand')} command
   * @returns {Promise<void>}
   */
  async handle(command) {
    const order = await this.orderRepository.findById(command.orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Доменний інваріант: видаляти можна тільки скасовані замовлення
    if (!order.canBeDeleted()) {
      throw new ValidationError('Only cancelled orders can be deleted');
    }

    await this.orderRepository.delete(command.orderId);
  }
}

module.exports = DeleteOrderHandler;
