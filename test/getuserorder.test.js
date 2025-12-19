const { getUserOrders } = require('../src/controllers/orders.controller');
const prisma = require('../src/prisma');

jest.mock('../src/prisma', () => ({
  orders: {
    findMany: jest.fn()
  }
}));

describe('Orders Controller - getUserOrders', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      query: {}
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  it('should return user orders with default pagination', async () => {
    const mockOrders = [
      {
        order_id: 1,
        cart_id: 1,
        delivery_date: new Date('2024-12-01'),
        total_price: '199.98',
        order_status: 'delivered',
        delivery: {
          delivery_id: 1,
          delivery_method: 'Express',
          delivery_address: '123 Main St',
          order_status: 'delivered'
        },
        payment: {
          payment_id: 1,
          transaction_date: new Date('2024-12-01'),
          payment_method: 'Credit Card',
          payment_status: 'completed'
        }
      }
    ];

    req.params.userId = '1';
    req.query = {};

    prisma.orders.findMany.mockResolvedValue(mockOrders);

    await getUserOrders(req, res);

    expect(prisma.orders.findMany).toHaveBeenCalledWith({
      where: {
        cart: { user_id: 1 }
      },
      include: {
        delivery: true,
        payment: true
      },
      orderBy: {
        delivery_date: 'desc'
      },
      take: 10,
      skip: 0
    });
    expect(res.json).toHaveBeenCalledWith(mockOrders);
  });

  it('should return orders with custom pagination page 1', async () => {
    const mockOrders = [];

    req.params.userId = '1';
    req.query = { page: '1', limit: '5' };

    prisma.orders.findMany.mockResolvedValue(mockOrders);

    await getUserOrders(req, res);

    expect(prisma.orders.findMany).toHaveBeenCalledWith({
      where: {
        cart: { user_id: 1 }
      },
      include: {
        delivery: true,
        payment: true
      },
      orderBy: {
        delivery_date: 'desc'
      },
      take: 5,
      skip: 0
    });
  });

  it('should calculate correct skip for page 2', async () => {
    req.params.userId = '1';
    req.query = { page: '2', limit: '10' };

    prisma.orders.findMany.mockResolvedValue([]);

    await getUserOrders(req, res);

    expect(prisma.orders.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        skip: 10
      })
    );
  });

  it('should calculate correct skip for page 3', async () => {
    req.params.userId = '1';
    req.query = { page: '3', limit: '20' };

    prisma.orders.findMany.mockResolvedValue([]);

    await getUserOrders(req, res);

    expect(prisma.orders.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 20,
        skip: 40
      })
    );
  });

  it('should return empty array when user has no orders', async () => {
    req.params.userId = '999';
    req.query = {};

    prisma.orders.findMany.mockResolvedValue([]);

    await getUserOrders(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('should return multiple orders sorted by date descending', async () => {
    const mockOrders = [
      {
        order_id: 3,
        delivery_date: new Date('2024-12-15'),
        order_status: 'shipped'
      },
      {
        order_id: 2,
        delivery_date: new Date('2024-12-10'),
        order_status: 'delivered'
      },
      {
        order_id: 1,
        delivery_date: new Date('2024-12-01'),
        order_status: 'delivered'
      }
    ];

    req.params.userId = '1';
    req.query = {};

    prisma.orders.findMany.mockResolvedValue(mockOrders);

    await getUserOrders(req, res);

    expect(res.json).toHaveBeenCalledWith(mockOrders);
  });

  it('should handle large page numbers', async () => {
    req.params.userId = '1';
    req.query = { page: '100', limit: '10' };

    prisma.orders.findMany.mockResolvedValue([]);

    await getUserOrders(req, res);

    expect(prisma.orders.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 990
      })
    );
  });

  it('should handle custom limit of 50', async () => {
    req.params.userId = '1';
    req.query = { limit: '50' };

    prisma.orders.findMany.mockResolvedValue([]);

    await getUserOrders(req, res);

    expect(prisma.orders.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 50
      })
    );
  });

  it('should include delivery and payment details', async () => {
    req.params.userId = '1';
    req.query = {};

    prisma.orders.findMany.mockResolvedValue([]);

    await getUserOrders(req, res);

    expect(prisma.orders.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          delivery: true,
          payment: true
        }
      })
    );
  });
});