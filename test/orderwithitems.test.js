const { createOrderWithItems } = require('../src/controllers/orders.controller');
const prisma = require('../src/prisma');

jest.mock('../src/prisma', () => ({
  $transaction: jest.fn()
}));

describe('createOrderWithItems', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  it('should create order with items successfully', async () => {
    const mockOrder = {
      order_id: 1,
      cart_id: 1,
      delivery_date: new Date(),
      total_price: '199.98',
      order_status: 'created',
      delivery_id: 1,
      payment_id: 1,
      cart: {
        cart_id: 1,
        user_id: 1,
        cartitems: [
          {
            cart_item_id: 1,
            cart_id: 1,
            product_id: 1,
            quantity: 2,
            product: {
              product_id: 1,
              product_name: 'Test Product',
              price: '99.99'
            }
          }
        ]
      },
      delivery: {
        delivery_id: 1,
        delivery_method: 'Нова пошта',
        delivery_address: 'вул. Срібнокільська 12',
        order_status: 'created'
      },
      payment: {
        payment_id: 1,
        transaction_date: new Date(),
        payment_method: 'Credit Card',
        payment_status: 'pending'
      }
    };

    req.body = {
      user_id: 1,
      delivery_method: 'Нова пошта',
      delivery_address: 'вул. Срібнокільська 12',
      payment_method: 'Credit Card',
      items: [
        { product_id: 1, quantity: 2 }
      ]
    };

    prisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        users: {
          findUnique: jest.fn().mockResolvedValue({ user_id: 1 })
        },
        product: {
          findMany: jest.fn().mockResolvedValue([
            { product_id: 1, price: '99.99' }
          ])
        },
        cart: {
          create: jest.fn().mockResolvedValue({ cart_id: 1 })
        },
        cartitems: {
          create: jest.fn()
        },
        payment: {
          create: jest.fn().mockResolvedValue({ payment_id: 1 })
        },
        delivery: {
          create: jest.fn().mockResolvedValue({ delivery_id: 1 })
        },
        orders: {
          create: jest.fn().mockResolvedValue(mockOrder)
        }
      };
      return callback(tx);
    });

    await createOrderWithItems(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockOrder);
  });

  it('should return 400 when missing required fields', async () => {
    req.body = {
      user_id: 1
    };

    await createOrderWithItems(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Missing required fields' });
  });

  it('should return 400 when items array is empty', async () => {
    req.body = {
      user_id: 1,
      delivery_method: 'Нова пошта',
      delivery_address: 'вул. Срібнокільська 12',
      payment_method: 'Credit Card',
      items: []
    };

    await createOrderWithItems(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Order must contain items' });
  });

  it('should return 400 when items is not an array', async () => {
    req.body = {
      user_id: 1,
      delivery_method: 'Нова пошта',
      delivery_address: 'вул. Срібнокільська 12',
      payment_method: 'Credit Card',
      items: 'not an array'
    };

    await createOrderWithItems(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Order must contain items' });
  });

  it('should return 400 when user not found', async () => {
    req.body = {
      user_id: 999,
      delivery_method: 'Нова пошта',
      delivery_address: 'вул. Срібнокільська 12',
      payment_method: 'Credit Card',
      items: [{ product_id: 1, quantity: 2 }]
    };

    prisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        users: {
          findUnique: jest.fn().mockResolvedValue(null)
        }
      };
      return callback(tx);
    });

    await createOrderWithItems(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Order creation failed',
      error: 'User not found'
    });
  });

  it('should return 400 when product not found', async () => {
    req.body = {
      user_id: 1,
      delivery_method: 'Нова пошта',
      delivery_address: 'вул. Срібнокільська 12',
      payment_method: 'Credit Card',
      items: [{ product_id: 999, quantity: 2 }]
    };

    prisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        users: {
          findUnique: jest.fn().mockResolvedValue({ user_id: 1 })
        },
        product: {
          findMany: jest.fn().mockResolvedValue([])
        }
      };
      return callback(tx);
    });

    await createOrderWithItems(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Order creation failed',
      error: 'One or more products not found'
    });
  });

  it('should return 400 when quantity is zero', async () => {
    req.body = {
      user_id: 1,
      delivery_method: 'Нова пошта',
      delivery_address: 'вул. Срібнокільська 12',
      payment_method: 'Credit Card',
      items: [{ product_id: 1, quantity: 0 }]
    };

    prisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        users: {
          findUnique: jest.fn().mockResolvedValue({ user_id: 1 })
        },
        product: {
          findMany: jest.fn().mockResolvedValue([{ product_id: 1 }])
        }
      };
      return callback(tx);
    });

    await createOrderWithItems(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Order creation failed',
      error: 'Invalid product quantity'
    });
  });

  it('should return 400 when quantity is negative', async () => {
    req.body = {
      user_id: 1,
      delivery_method: 'Нова пошта',
      delivery_address: 'вул. Срібнокільська 12',
      payment_method: 'Credit Card',
      items: [{ product_id: 1, quantity: -5 }]
    };

    prisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        users: {
          findUnique: jest.fn().mockResolvedValue({ user_id: 1 })
        },
        product: {
          findMany: jest.fn().mockResolvedValue([{ product_id: 1 }])
        }
      };
      return callback(tx);
    });

    await createOrderWithItems(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Order creation failed',
      error: 'Invalid product quantity'
    });
  });

  it('should calculate correct total price for multiple items', async () => {
    req.body = {
      user_id: 1,
      delivery_method: 'Нова пошта',
      delivery_address: 'вул. Срібнокільська 12',
      payment_method: 'Credit Card',
      items: [
        { product_id: 1, quantity: 2 },
        { product_id: 2, quantity: 3 }
      ]
    };

    const mockOrder = {
      order_id: 1,
      total_price: '349.95'
    };

    prisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        users: {
          findUnique: jest.fn().mockResolvedValue({ user_id: 1 })
        },
        product: {
          findMany: jest.fn().mockResolvedValue([
            { product_id: 1, price: '99.99' },
            { product_id: 2, price: '49.99' }
          ])
        },
        cart: {
          create: jest.fn().mockResolvedValue({ cart_id: 1 })
        },
        cartitems: {
          create: jest.fn()
        },
        payment: {
          create: jest.fn().mockResolvedValue({ payment_id: 1 })
        },
        delivery: {
          create: jest.fn().mockResolvedValue({ delivery_id: 1 })
        },
        orders: {
          create: jest.fn().mockResolvedValue(mockOrder)
        }
      };
      return callback(tx);
    });

    await createOrderWithItems(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockOrder);
  });
});