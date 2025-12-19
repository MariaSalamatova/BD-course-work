const { getCart } = require('../src/controllers/cart.controller');
const prisma = require('../src/prisma');

jest.mock('../src/prisma', () => ({
  cart: {
    findUnique: jest.fn()
  }
}));

describe('Cart Controller - getCart', () => {
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

  it('should return cart with items when cart exists', async () => {
    const mockCart = {
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
            product_name: 'Pen',
            info: 'The best pen in the world',
            price: '100.99'
          }
        }
      ]
    };

    req.params.id = '1';
    prisma.cart.findUnique.mockResolvedValue(mockCart);

    await getCart(req, res);

    expect(prisma.cart.findUnique).toHaveBeenCalledWith({
      where: { cart_id: 1 },
      include: {
        cartitems: {
          include: { product: true }
        }
      }
    });
    expect(res.json).toHaveBeenCalledWith(mockCart);
  });

  it('should return 404 when cart does not exist', async () => {
    req.params.id = '999';
    prisma.cart.findUnique.mockResolvedValue(null);

    await getCart(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Cart not found' });
  });

  it('should return 500 on database error', async () => {
    req.params.id = '1';
    const error = new Error('Database error');
    prisma.cart.findUnique.mockRejectedValue(error);

    await getCart(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error fetching cart',
      error: 'Database error'
    });
  });
});