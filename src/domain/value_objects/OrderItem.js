const { ValidationError } = require('../errors/DomainError');

class OrderItem {
  #productId;
  #quantity;
  #price;

  constructor({ productId, quantity, price }) {
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new ValidationError('product_id must be a positive integer');
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ValidationError('quantity must be a positive integer');
    }
    if (price !== undefined && Number(price) < 0) {
      throw new ValidationError('price cannot be negative');
    }

    this.#productId = productId;
    this.#quantity = quantity;
    this.#price = price !== undefined ? Number(price) : null;
  }

  getProductId() { return this.#productId; }
  getQuantity() { return this.#quantity; }
  getPrice() { return this.#price; }

  getSubtotal() {
    if (this.#price === null) throw new ValidationError('Price not set for OrderItem');
    return this.#price * this.#quantity;
  }

  toPlain() {
    return {
      productId: this.#productId,
      quantity: this.#quantity,
      price: this.#price
    };
  }
}

module.exports = OrderItem;
