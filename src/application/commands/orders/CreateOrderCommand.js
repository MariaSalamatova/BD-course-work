class CreateOrderCommand {
  /**
   * @param {object} data
   * @param {number} data.userId
   * @param {string} data.deliveryMethod
   * @param {string} data.deliveryAddress
   * @param {string} data.paymentMethod
   * @param {Array<{product_id: number, quantity: number}>} data.items
   */
  constructor({ userId, deliveryMethod, deliveryAddress, paymentMethod, items }) {
    this.userId = userId;
    this.deliveryMethod = deliveryMethod;
    this.deliveryAddress = deliveryAddress;
    this.paymentMethod = paymentMethod;
    this.items = items;
  }
}

module.exports = CreateOrderCommand;
