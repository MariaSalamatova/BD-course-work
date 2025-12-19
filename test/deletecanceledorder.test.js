const { deleteCancelledOrder } = require('../src/controllers/orders.controller');
const prisma = require('../src/prisma');

jest.mock('../src/prisma', () => ({
  $transaction: jest.fn()
}));

describe('Orders Controller - deleteCancelledOrder', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {}
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  it('should delete cancelled order successfully', async () => {
    req.params.orderId = '1';

    prisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        orders: {
          findUnique: jest.fn().mockResolvedValue({
            order_id: 1,
            order_status: 'cancelled'
          }),
          delete: jest.fn().mockResolvedValue({
            order_id: 1
          })
        }
      };
      return callback(tx);
    });

    await deleteCancelledOrder(req, res);

    expect(res.json).toHaveBeenCalledWith({ 
      message: 'Order permanently deleted (hard delete)' 
    });
  });

  it('should return 400 when order not found', async () => {
    req.params.orderId = '999';

    prisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        orders: {
          findUnique: jest.fn().mockResolvedValue(null)
        }
      };
      return callback(tx);
    });

    await deleteCancelledOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Order not found' });
  });

  it('should return 400 when order status is created', async () => {
    req.params.orderId = '1';

    prisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        orders: {
          findUnique: jest.fn().mockResolvedValue({
            order_id: 1,
            order_status: 'created'
          })
        }
      };
      return callback(tx);
    });

    await deleteCancelledOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ 
      message: 'Only cancelled orders can be deleted' 
    });
  });

  it('should return 400 when order status is processing', async () => {
    req.params.orderId = '1';

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

    await deleteCancelledOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ 
      message: 'Only cancelled orders can be deleted' 
    });
  });

  it('should return 400 when order status is shipped', async () => {
    req.params.orderId = '1';

    prisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        orders: {
          findUnique: jest.fn().mockResolvedValue({
            order_id: 1,
            order_status: 'shipped'
          })
        }
      };
      return callback(tx);
    });

    await deleteCancelledOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ 
      message: 'Only cancelled orders can be deleted' 
    });
  });

  it('should return 400 when order status is delivered', async () => {
    req.params.orderId = '1';

    prisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        orders: {
          findUnique: jest.fn().mockResolvedValue({
            order_id: 1,
            order_status: 'delivered'
          })
        }
      };
      return callback(tx);
    });

    await deleteCancelledOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ 
      message: 'Only cancelled orders can be deleted' 
    });
  });

  it('should handle database errors during deletion', async () => {
    req.params.orderId = '1';

    prisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        orders: {
          findUnique: jest.fn().mockResolvedValue({
            order_id: 1,
            order_status: 'cancelled'
          }),
          delete: jest.fn().mockRejectedValue(new Error('Database connection failed'))
        }
      };
      return callback(tx);
    });

    await deleteCancelledOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ 
      message: 'Database connection failed' 
    });
  });
});