const { NotFoundError } = require('../../../domain/errors/DomainError');

class UpdateOrderStatusHandler {
  /**
   * @param {import('../../../domain/repositories').IOrderRepository} orderRepository
   */
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  /**
   * @param {import('./UpdateOrderStatusCommand')} command
   * @returns {Promise<void>}
   */
  async handle(command) {
    const order = await this.orderRepository.findById(command.orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    order.updateStatus(command.newStatus, command.currentStatus);

    await this.orderRepository.update(order);
  }
}

module.exports = UpdateOrderStatusHandler;
