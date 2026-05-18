const { ValidationError } = require('../errors/DomainError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class Email {
  #value;

  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('Email is required');
    }
    if (!EMAIL_REGEX.test(value)) {
      throw new ValidationError(`Invalid email format: "${value}"`);
    }
    this.#value = value.toLowerCase().trim();
  }

  getValue() {
    return this.#value;
  }

  equals(other) {
    return other instanceof Email && other.getValue() === this.#value;
  }

  toString() {
    return this.#value;
  }
}

module.exports = Email;
