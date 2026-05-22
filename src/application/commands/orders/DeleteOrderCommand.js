class DeleteOrderCommand {
  /**
   * @param {object} data
   * @param {number} data.orderId
   */
  constructor({ orderId }) {
    this.orderId = orderId;
  }
}

module.exports = DeleteOrderCommand;
