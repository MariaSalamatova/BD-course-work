const OrderFactory = require('../../domain/factories/OrderFactory');
const OrderItem = require('../../domain/value-objects/OrderItem');
const Money = require('../../domain/value-objects/Money');

class OrderMapper {
  static toDomain(prismaOrder) {
    const items = (prismaOrder.cart?.cartitems || []).map(ci =>
      new OrderItem({
        productId: ci.product_id,
        quantity: ci.quantity,
        price: ci.product ? Number(ci.product.price) : 0
      })
    );

    return OrderFactory.reconstitute({
      id: prismaOrder.order_id,
      userId: prismaOrder.cart?.user_id ?? null,
      items,
      status: prismaOrder.order_status,
      deliveryMethod: prismaOrder.delivery?.delivery_method ?? '',
      deliveryAddress: prismaOrder.delivery?.delivery_address ?? '',
      paymentMethod: prismaOrder.payment?.payment_method ?? '',
      totalPrice: Number(prismaOrder.total_price),
      createdAt: prismaOrder.delivery_date
    });
  }

  static toResponse(order) {
    return {
      order_id: order.getId(),
      user_id: order.getUserId(),
      status: order.getStatus(),
      delivery_method: order.getDeliveryMethod(),
      delivery_address: order.getDeliveryAddress(),
      payment_method: order.getPaymentMethod(),
      total_price: order.getTotalPrice().getAmount(),
      items: order.getItems().map(item => ({
        product_id: item.getProductId(),
        quantity: item.getQuantity(),
        price: item.getPrice()
      })),
      created_at: order.getCreatedAt()
    };
  }
}

module.exports = OrderMapper;
