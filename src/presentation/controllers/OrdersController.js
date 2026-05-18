const { DomainError, ValidationError, NotFoundError, ConflictError } = require('../../domain/errors/DomainError');
const OrderMapper = require('../../infrastructure/mappers/OrderMapper');

function domainErrorToStatus(error) {
  if (error instanceof ValidationError) return 400;
  if (error instanceof NotFoundError) return 404;
  if (error instanceof ConflictError) return 409;
  return 500;
}

class OrdersController {
  constructor({ createOrder, updateOrderStatus, deleteOrder, getUserOrders, getProductsByCategory }) {
    this.createOrder = createOrder;
    this.updateOrderStatus = updateOrderStatus;
    this.deleteOrder = deleteOrder;
    this.getUserOrders = getUserOrders;
    this.getProductsByCategory = getProductsByCategory;
  }

  async create(req, res) {
    try {
      const order = await this.createOrder.execute({
        userId: req.user.user_id,
        ...req.body
      });
      res.status(201).json(OrderMapper.toResponse(order));
    } catch (error) {
      const status = domainErrorToStatus(error);
      res.status(status).json({ message: error.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const order = await this.updateOrderStatus.execute({
        orderId: Number(req.params.orderId),
        ...req.body
      });
      res.json(OrderMapper.toResponse(order));
    } catch (error) {
      const status = domainErrorToStatus(error);
      res.status(status).json({ message: error.message });
    }
  }

  async delete(req, res) {
    try {
      await this.deleteOrder.execute({ orderId: Number(req.params.orderId) });
      res.json({ message: 'Order permanently deleted (hard delete)' });
    } catch (error) {
      const status = domainErrorToStatus(error);
      res.status(status).json({ message: error.message });
    }
  }

  async getUserOrdersList(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const orders = await this.getUserOrders.execute({
        userId: Number(req.params.userId),
        page: Number(page),
        limit: Number(limit)
      });
      res.json(orders.map(OrderMapper.toResponse));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getByCategory(req, res) {
    try {
      const products = await this.getProductsByCategory.execute({
        categoryId: Number(req.params.categoryId)
      });
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = OrdersController;
