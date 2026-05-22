const CreateOrderCommand = require('../../application/commands/orders/CreateOrderCommand');
const UpdateOrderStatusCommand = require('../../application/commands/orders/UpdateOrderStatusCommand');
const DeleteOrderCommand = require('../../application/commands/orders/DeleteOrderCommand');
const { GetUserOrdersQuery } = require('../../application/queries/orders/GetUserOrdersQuery');
const { GetProductsByCategoryQuery } = require('../../application/queries/orders/GetProductsByCategoryQuery');
const { DomainError, ValidationError, NotFoundError, ConflictError } = require('../../domain/errors/DomainError');

class OrdersController {
  /**
   * @param {object} handlers
   * @param {import('../../application/commands/orders/CreateOrderHandler')} handlers.createOrderHandler
   * @param {import('../../application/commands/orders/UpdateOrderStatusHandler')} handlers.updateOrderStatusHandler
   * @param {import('../../application/commands/orders/DeleteOrderHandler')} handlers.deleteOrderHandler
   * @param {import('../../application/queries/orders/GetUserOrdersQuery').GetUserOrdersHandler} handlers.getUserOrdersHandler
   * @param {import('../../application/queries/orders/GetProductsByCategoryQuery').GetProductsByCategoryHandler} handlers.getProductsByCategoryHandler
   */
  constructor({
    createOrderHandler,
    updateOrderStatusHandler,
    deleteOrderHandler,
    getUserOrdersHandler,
    getProductsByCategoryHandler,
  }) {
    this.createOrderHandler = createOrderHandler;
    this.updateOrderStatusHandler = updateOrderStatusHandler;
    this.deleteOrderHandler = deleteOrderHandler;
    this.getUserOrdersHandler = getUserOrdersHandler;
    this.getProductsByCategoryHandler = getProductsByCategoryHandler;
  }

  async createOrder(req, res) {
    try {
      const command = new CreateOrderCommand({
        userId: req.user.userId,
        deliveryMethod: req.body.delivery_method,
        deliveryAddress: req.body.delivery_address,
        paymentMethod: req.body.payment_method,
        items: req.body.items,
      });

      const orderId = await this.createOrderHandler.handle(command);
      res.status(201).json({ order_id: orderId });
    } catch (err) {
      this._handleError(err, res);
    }
  }

  async updateOrderStatus(req, res) {
    try {
      const command = new UpdateOrderStatusCommand({
        orderId: Number(req.params.id),
        newStatus: req.body.new_status,
        currentStatus: req.body.current_status,
      });

      await this.updateOrderStatusHandler.handle(command);
      res.status(204).send();
    } catch (err) {
      this._handleError(err, res);
    }
  }

  async deleteOrder(req, res) {
    try {
      const command = new DeleteOrderCommand({
        orderId: Number(req.params.id),
      });

      await this.deleteOrderHandler.handle(command);
      res.status(204).send();
    } catch (err) {
      this._handleError(err, res);
    }
  }

  async getUserOrders(req, res) {
    try {
      const query = new GetUserOrdersQuery({
        userId: req.user.userId,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      });

      const orders = await this.getUserOrdersHandler.handle(query);
      res.json(orders);
    } catch (err) {
      this._handleError(err, res);
    }
  }

  async getProductsByCategory(req, res) {
    try {
      const query = new GetProductsByCategoryQuery({
        categoryId: Number(req.query.category_id),
      });

      const products = await this.getProductsByCategoryHandler.handle(query);
      res.json(products);
    } catch (err) {
      this._handleError(err, res);
    }
  }

  _handleError(err, res) {
    if (err instanceof ValidationError) return res.status(400).json({ message: err.message });
    if (err instanceof NotFoundError)   return res.status(404).json({ message: err.message });
    if (err instanceof ConflictError)   return res.status(409).json({ message: err.message });
    if (err instanceof DomainError)     return res.status(422).json({ message: err.message });
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = OrdersController;