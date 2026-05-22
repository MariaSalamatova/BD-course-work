const Email = require('../value-objects/Email');
const { ValidationError } = require('../errors/DomainError');

class User {
  #id;
  #email;
  #name;
  #passwordHash;

  constructor({ id = null, email, name, passwordHash }) {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('Name cannot be empty');
    }

    this.#id = id;
    this.#email = email instanceof Email ? email : new Email(email);
    this.#name = name.trim();
    this.#passwordHash = passwordHash;
  }

  getId() { return this.#id; }
  getEmail() { return this.#email; }
  getName() { return this.#name; }
  getPasswordHash() { return this.#passwordHash; }

  toPlain() {
    return {
      id: this.#id,
      email: this.#email.getValue(),
      name: this.#name
    };
  }
}

module.exports = User;
