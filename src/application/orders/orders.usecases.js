const { NotFoundError, ValidationError } = require('../../domain/errors/domain.errors');

class DeleteOrderUseCase {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute({ orderId }) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');

    if (!order.canBeDeleted()) {
      throw new ValidationError('Only cancelled orders can be deleted');
    }

    await this.orderRepository.delete(orderId);
  }
}

class GetUserOrdersUseCase {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute({ userId, page = 1, limit = 10 }) {
    return this.orderRepository.findByUserId(userId, { page, limit });
  }
}

class GetProductsByCategoryUseCase {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  async execute({ categoryId }) {
    return this.productRepository.findByCategoryId(categoryId);
  }
}

module.exports = { DeleteOrderUseCase, GetUserOrdersUseCase, GetProductsByCategoryUseCase };
