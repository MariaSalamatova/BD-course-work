const { IOrderRepository } = require('../../domain/repositories');
const OrderMapper = require('../mappers/OrderMapper');

const ORDER_INCLUDE = {
  cart: {
    include: {
      cartitems: { include: { product: true } }
    }
  },
  delivery: true,
  payment: true
};

class PrismaOrderRepository extends IOrderRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async findById(id) {
    const record = await this.prisma.orders.findUnique({
      where: { order_id: id },
      include: ORDER_INCLUDE
    });
    return record ? OrderMapper.toDomain(record) : null;
  }

  async findByUserId(userId, { page = 1, limit = 10 } = {}) {
    const records = await this.prisma.orders.findMany({
      where: { cart: { user_id: userId } },
      include: ORDER_INCLUDE,
      orderBy: { delivery_date: 'desc' },
      take: limit,
      skip: (page - 1) * limit
    });
    return records.map(OrderMapper.toDomain);
  }

  async save(order) {
    const items = order.getItems();

    const saved = await this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.create({ data: { user_id: order.getUserId() } });

      for (const item of items) {
        await tx.cartitems.create({
          data: {
            cart_id: cart.cart_id,
            product_id: item.getProductId(),
            quantity: item.getQuantity()
          }
        });
      }

      const payment = await tx.payment.create({
        data: {
          transaction_date: new Date(),
          payment_method: order.getPaymentMethod(),
          payment_status: 'pending'
        }
      });

      const delivery = await tx.delivery.create({
        data: {
          delivery_method: order.getDeliveryMethod(),
          delivery_address: order.getDeliveryAddress(),
          order_status: 'created'
        }
      });

      return tx.orders.create({
        data: {
          cart_id: cart.cart_id,
          delivery_date: new Date(),
          total_price: order.getTotalPrice().getAmount(),
          order_status: order.getStatus(),
          delivery_id: delivery.delivery_id,
          payment_id: payment.payment_id
        },
        include: ORDER_INCLUDE
      });
    });

    return OrderMapper.toDomain(saved);
  }

  async update(order) {
    const updated = await this.prisma.orders.update({
      where: { order_id: order.getId() },
      data: { order_status: order.getStatus() },
      include: ORDER_INCLUDE
    });
    return OrderMapper.toDomain(updated);
  }

  async delete(id) {
    await this.prisma.orders.delete({ where: { order_id: id } });
  }
}

module.exports = PrismaOrderRepository;
