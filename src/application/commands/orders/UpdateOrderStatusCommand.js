class UpdateOrderStatusCommand {
  /**
   * @param {object} data
   * @param {number} data.orderId
   * @param {string} data.newStatus
   * @param {string} data.currentStatus
   */
  constructor({ orderId, newStatus, currentStatus }) {
    this.orderId = orderId;
    this.newStatus = newStatus;
    this.currentStatus = currentStatus;
  }
}

module.exports = UpdateOrderStatusCommand;
