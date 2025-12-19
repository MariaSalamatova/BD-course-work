const { updateOrderStatus } = require('../src/controllers/orders.controller');
const prisma = require('../src/prisma');

jest.mock('../src/prisma', () => ({
  $transaction: jest.fn()
}));

describe('Orders Controller - updateOrderStatus', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      body: {}
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  it('should update order status successfully', async () => {
    const mockUpdatedOrder = {
      order_id: 1,
      cart_id: 1,
      delivery_date: new Date(),
      total_price: '199.98',
      order_status: 'shipped',
      delivery_id: 1,
      payment_id: 1
    };

    req.params.orderId = '1';
    req.body = {
      newStatus: 'shipped',
      currentStatus: 'created'
    };

    prisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        orders: {
          findUnique: jest.fn().mockResolvedValue({
            order_id: 1,
            order_status: 'created'
          }),
          update: jest.fn().mockResolvedValue(mockUpdatedOrder)
        }
      };
      return callback(tx);
    });

    await updateOrderStatus(req, res);

    expect(res.json).toHaveBeenCalledWith(mockUpdatedOrder);
  });

  it('should return 400 when newStatus is missing', async () => {
    req.params.orderId = '1';
    req.body = {
      currentStatus: 'created'
    };

    await updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Missing status fields' });
  });

  it('should return 400 when currentStatus is missing', async () => {
    req.params.orderId = '1';
    req.body = {
      newStatus: 'shipped'
    };

    await updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Missing status fields' });
  });

  it('should return 400 when both status fields are missing', async () => {
    req.params.orderId = '1';
    req.body = {};

    await updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Missing status fields' });
  });

  it('should return 409 when order not found', async () => {
    req.params.orderId = '999';
    req.body = {
      newStatus: 'shipped',
      currentStatus: 'created'
    };

    prisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        orders: {
          findUnique: jest.fn().mockResolvedValue(null)
        }
      };
      return callback(tx);
    });

    await updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: 'Order not found' });
  });

  it('should return 409 when order status has changed (optimistic locking)', async () => {
    req.params.orderId = '1';
    req.body = {
      newStatus: 'shipped',
      currentStatus: 'created'
    };

    prisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        orders: {
          findUnique: jest.fn().mockResolvedValue({
            order_id: 1,
            order_status: 'processing'
          })
        }
      };
      return callback(tx);
    });

    await updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ 
      message: 'Order status has changed. Retry operation.' 
    });
  });

  it('should return 409 when trying to update cancelled order', async () => {
    req.params.orderId = '1';
    req.body = {
      newStatus: 'shipped',
      currentStatus: 'cancelled'
    };

    prisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        orders: {
          findUnique: jest.fn().mockResolvedValue({
            order_id: 1,
            order_status: 'cancelled'
          })
        }
      };
      return callback(tx);
    });

    await updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ 
      message: 'Cancelled order cannot be updated' 
    });
  });

  it('should update status from created to processing', async () => {
    const mockUpdatedOrder = {
      order_id: 1,
      order_status: 'processing'
    };

    req.params.orderId = '1';
    req.body = {
      newStatus: 'processing',
      currentStatus: 'created'
    };

    prisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        orders: {
          findUnique: jest.fn().mockResolvedValue({
            order_id: 1,
            order_status: 'created'
          }),
          update: jest.fn().mockResolvedValue(mockUpdatedOrder)
        }
      };
      return callback(tx);
    });

    await updateOrderStatus(req, res);

    expect(res.json).toHaveBeenCalledWith(mockUpdatedOrder);
  });

  it('should update status from processing to shipped', async () => {
    const mockUpdatedOrder = {
      order_id: 1,
      order_status: 'shipped'
    };

    req.params.orderId = '1';
    req.body = {
      newStatus: 'shipped',
      currentStatus: 'processing'
    };

    prisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        orders: {
          findUnique: jest.fn().mockResolvedValue({
            order_id: 1,
            order_status: 'processing'
          }),
          update: jest.fn().mockResolvedValue(mockUpdatedOrder)
        }
      };
      return callback(tx);
    });

    await updateOrderStatus(req, res);

    expect(res.json).toHaveBeenCalledWith(mockUpdatedOrder);
  });

  it('should update status from shipped to delivered', async () => {
    const mockUpdatedOrder = {
      order_id: 1,
      order_status: 'delivered'
    };

    req.params.orderId = '1';
    req.body = {
      newStatus: 'delivered',
      currentStatus: 'shipped'
    };

    prisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        orders: {
          findUnique: jest.fn().mockResolvedValue({
            order_id: 1,
            order_status: 'shipped'
          }),
          update: jest.fn().mockResolvedValue(mockUpdatedOrder)
        }
      };
      return callback(tx);
    });

    await updateOrderStatus(req, res);

    expect(res.json).toHaveBeenCalledWith(mockUpdatedOrder);
  });
});