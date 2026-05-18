const { ValidationError } = require('../errors/DomainError');

class Money {
  #amount;

  constructor(amount) {
    const num = Number(amount);
    if (isNaN(num)) {
      throw new ValidationError('Money amount must be a number');
    }
    if (num < 0) {
      throw new ValidationError('Money amount cannot be negative');
    }
    this.#amount = Math.round(num * 100) / 100;
  }

  getAmount() {
    return this.#amount;
  }

  add(other) {
    return new Money(this.#amount + other.getAmount());
  }

  equals(other) {
    return other instanceof Money && other.getAmount() === this.#amount;
  }

  toString() {
    return `${this.#amount}`;
  }
}

module.exports = Money;
