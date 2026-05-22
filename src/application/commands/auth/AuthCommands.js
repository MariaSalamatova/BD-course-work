class RegisterCommand {
  /**
   * @param {object} data
   * @param {string} data.email
   * @param {string} data.password
   * @param {string} data.name
   */
  constructor({ email, password, name }) {
    this.email = email;
    this.password = password;
    this.name = name;
  }
}

class LoginCommand {
  /**
   * @param {object} data
   * @param {string} data.email
   * @param {string} data.password
   */
  constructor({ email, password }) {
    this.email = email;
    this.password = password;
  }
}

module.exports = { RegisterCommand, LoginCommand };
