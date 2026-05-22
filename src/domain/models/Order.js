const { ValidationError, ConflictError } = require('../errors/DomainError');
const Money = require('../value-objects/Money');

const VALID_STATUSES = ['created', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const VALID_DELIVERY_METHODS = ['courier', 'pickup', 'post'];
const VALID_PAYMENT_METHODS = ['card', 'cash', 'online'];

class Order {
  #id;
  #userId;
  #items;
  #status;
  #deliveryMethod;
  #deliveryAddress;
  #paymentMethod;
  #totalPrice;
  #createdAt;

  constructor({
    id = null,
    userId,
    items,
    status = 'created',
    deliveryMethod,
    deliveryAddress,
    paymentMethod,
    totalPrice,
    createdAt = new Date()
  }) {
    if (!VALID_DELIVERY_METHODS.includes(deliveryMethod)) {
      throw new ValidationError(
        `Invalid delivery_method. Must be: ${VALID_DELIVERY_METHODS.join(', ')}`
      );
    }
    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      throw new ValidationError(
        `Invalid payment_method. Must be: ${VALID_PAYMENT_METHODS.join(', ')}`
      );
    }
    if (!deliveryAddress || deliveryAddress.trim().length === 0) {
      throw new ValidationError('delivery_address cannot be empty');
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new ValidationError('Order must contain at least one item');
    }
    if (!VALID_STATUSES.includes(status)) {
      throw new ValidationError(`Invalid status: ${status}`);
    }

    this.#id = id;
    this.#userId = userId;
    this.#items = items;
    this.#status = status;
    this.#deliveryMethod = deliveryMethod;
    this.#deliveryAddress = deliveryAddress.trim();
    this.#paymentMethod = paymentMethod;
    this.#totalPrice = totalPrice instanceof Money ? totalPrice : new Money(totalPrice ?? 0);
    this.#createdAt = createdAt;
  }

  updateStatus(newStatus, expectedCurrentStatus) {
    if (!VALID_STATUSES.includes(newStatus)) {
      throw new ValidationError(
        `Invalid newStatus. Must be: ${VALID_STATUSES.join(', ')}`
      );
    }
    if (this.#status === 'cancelled') {
      throw new ConflictError('Cancelled order cannot be updated');
    }
    if (this.#status !== expectedCurrentStatus) {
      throw new ConflictError('Order status has changed. Please retry the operation.');
    }
    this.#status = newStatus;
  }

  canBeDeleted() {
    return this.#status === 'cancelled';
  }

  isCancelled() {
    return this.#status === 'cancelled';
  }
  
  getId() { return this.#id; }
  getUserId() { return this.#userId; }
  getItems() { return [...this.#items]; }
  getStatus() { return this.#status; }
  getDeliveryMethod() { return this.#deliveryMethod; }
  getDeliveryAddress() { return this.#deliveryAddress; }
  getPaymentMethod() { return this.#paymentMethod; }
  getTotalPrice() { return this.#totalPrice; }
  getCreatedAt() { return this.#createdAt; }

  toPlain() {
    return {
      id: this.#id,
      userId: this.#userId,
      items: this.#items.map(i => i.toPlain ? i.toPlain() : i),
      status: this.#status,
      deliveryMethod: this.#deliveryMethod,
      deliveryAddress: this.#deliveryAddress,
      paymentMethod: this.#paymentMethod,
      totalPrice: this.#totalPrice.getAmount(),
      createdAt: this.#createdAt
    };
  }
}

module.exports = { Order, VALID_STATUSES, VALID_DELIVERY_METHODS, VALID_PAYMENT_METHODS };
