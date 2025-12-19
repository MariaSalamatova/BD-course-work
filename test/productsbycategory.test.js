const { getProductsByCategory } = require('../src/controllers/orders.controller');
const prisma = require('../src/prisma');

jest.mock('../src/prisma', () => ({
  product: {
    findMany: jest.fn()
  }
}));

describe('Orders Controller - getProductsByCategory', () => {
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

  it('should return products filtered by category sorted by price ascending', async () => {
    const mockProducts = [
      {
        product_id: 1,
        product_name: 'Cool stickers',
        info: 'Some cool stickers to buy',
        price: '50.00'
      },
      {
        product_id: 2,
        product_name: 'A knight figure',
        info: 'An armored knight figure for boys',
        price: '75.00'
      },
      {
        product_id: 3,
        product_name: 'A barbie doll',
        info: 'Mermaid Barbie',
        price: '100.00'
      }
    ];

    req.params.categoryId = '1';

    prisma.product.findMany.mockResolvedValue(mockProducts);

    await getProductsByCategory(req, res);

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: {
        productcategoryconnection: {
          some: { category_id: 1 }
        }
      },
      orderBy: { price: 'asc' }
    });
    expect(res.json).toHaveBeenCalledWith(mockProducts);
  });

  it('should return empty array when category has no products', async () => {
    req.params.categoryId = '999';

    prisma.product.findMany.mockResolvedValue([]);

    await getProductsByCategory(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('should handle category with single product', async () => {
    const mockProducts = [
      {
        product_id: 1,
        product_name: 'Single Product',
        info: 'Only product in category',
        price: '99.99'
      }
    ];

    req.params.categoryId = '5';

    prisma.product.findMany.mockResolvedValue(mockProducts);

    await getProductsByCategory(req, res);

    expect(res.json).toHaveBeenCalledWith(mockProducts);
  });

  it('should order products by price in ascending order', async () => {
    req.params.categoryId = '1';

    prisma.product.findMany.mockResolvedValue([]);

    await getProductsByCategory(req, res);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { price: 'asc' }
      })
    );
  });

  it('should filter products using some condition on productcategoryconnection', async () => {
    req.params.categoryId = '2';

    prisma.product.findMany.mockResolvedValue([]);

    await getProductsByCategory(req, res);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          productcategoryconnection: {
            some: { category_id: 2 }
          }
        }
      })
    );
  });

  it('should return products with all fields', async () => {
    const mockProducts = [
      {
        product_id: 10,
        product_name: 'Complete Product',
        info: 'Full product information with all details',
        price: '199.99'
      }
    ];

    req.params.categoryId = '3';

    prisma.product.findMany.mockResolvedValue(mockProducts);

    await getProductsByCategory(req, res);

    expect(res.json).toHaveBeenCalledWith(mockProducts);
    expect(mockProducts[0]).toHaveProperty('product_id');
    expect(mockProducts[0]).toHaveProperty('product_name');
    expect(mockProducts[0]).toHaveProperty('info');
    expect(mockProducts[0]).toHaveProperty('price');
  });

  it('should handle products with different price ranges', async () => {
    const mockProducts = [
      { product_id: 1, product_name: 'Notebook', price: '10' },
      { product_id: 2, product_name: 'Pen', price: '49.99' },
      { product_id: 3, product_name: 'Barbie dollhouse', price: '200' },
      { product_id: 4, product_name: 'TV', price: '890.99' }
    ];

    req.params.categoryId = '1';

    prisma.product.findMany.mockResolvedValue(mockProducts);

    await getProductsByCategory(req, res);

    expect(res.json).toHaveBeenCalledWith(mockProducts);
  });

  it('should convert categoryId string to number', async () => {
    req.params.categoryId = '42';

    prisma.product.findMany.mockResolvedValue([]);

    await getProductsByCategory(req, res);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          productcategoryconnection: {
            some: { category_id: 42 }
          }
        }
      })
    );
  });
});