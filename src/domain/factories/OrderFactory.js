const { Order } = require('../models/Order');
const OrderItem = require('../value-objects/OrderItem');
const Money = require('../value-objects/Money');
const { NotFoundError } = require('../errors/DomainError');

class OrderFactory {
  /**
   * @param {import('../repositories').IProductRepository} productRepository
   */
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

   /**
   * @param {{ userId, deliveryMethod, deliveryAddress, paymentMethod, items[] }} data
   * @returns {Promise<Order>}
    */
  async create({ userId, deliveryMethod, deliveryAddress, paymentMethod, items }) {
    const productIds = items.map(i => i.product_id);
    const products = await this.productRepository.findByIds(productIds);

    if (products.length !== items.length) {
      const foundIds = products.map(p => p.id);
      const missingIds = productIds.filter(id => !foundIds.includes(id));
      throw new NotFoundError(`Products not found: ${missingIds.join(', ')}`);
    }
    
    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.product_id);
      return new OrderItem({
        productId: item.product_id,
        quantity: item.quantity,
        price: Number(product.price)
      });
    });

    const totalPrice = new Money(
      orderItems.reduce((sum, item) => sum + item.getSubtotal(), 0)
    );

    return new Order({
      userId,
      items: orderItems,
      status: 'created',
      deliveryMethod,
      deliveryAddress,
      paymentMethod,
      totalPrice
    });
  }

  static reconstitute(data) {
    return new Order({
      id: data.id,
      userId: data.userId,
      items: (data.items || []).map(i =>
        new OrderItem({ productId: i.productId, quantity: i.quantity, price: i.price })
      ),
      status: data.status,
      deliveryMethod: data.deliveryMethod,
      deliveryAddress: data.deliveryAddress,
      paymentMethod: data.paymentMethod,
      totalPrice: new Money(data.totalPrice),
      createdAt: data.createdAt
    });
  }
}

module.exports = OrderFactory;
