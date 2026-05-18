const { NotFoundError } = require('../../domain/errors/DomainError');

class UpdateOrderStatusUseCase {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute({ orderId, newStatus, currentStatus }) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    order.updateStatus(newStatus, currentStatus);

    return this.orderRepository.update(order);
  }
}

module.exports = UpdateOrderStatusUseCase;
