class GetUserOrdersQuery {
  /**
   * @param {object} data
   * @param {number} data.userId
   * @param {number} [data.page=1]
   * @param {number} [data.limit=10]
   */
  constructor({ userId, page = 1, limit = 10 }) {
    this.userId = userId;
    this.page = page;
    this.limit = limit;
  }
}

class GetUserOrdersHandler {
  /**
   * @param {import('../../../domain/repositories').IOrderRepository} orderRepository
   */
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  /**
   * @param {GetUserOrdersQuery} query
   * @returns {Promise<Array>} — Read Model (DTO), не доменні моделі
   */
  async handle(query) {
    const orders = await this.orderRepository.findByUserId(query.userId, {
      page: query.page,
      limit: query.limit,
    });

    return orders.map(order => ({
      order_id: order.getId(),
      status: order.getStatus(),
      delivery_method: order.getDeliveryMethod(),
      delivery_address: order.getDeliveryAddress(),
      payment_method: order.getPaymentMethod(),
      total_price: order.getTotalPrice().getAmount(),
      items_count: order.getItems().length,
      created_at: order.getCreatedAt(),
    }));
  }
}

module.exports = { GetUserOrdersQuery, GetUserOrdersHandler };
