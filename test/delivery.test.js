const { getDelivery, getPopularDelivery } = require('../src/controllers/delivery.controller');
const prisma = require('../src/prisma');

jest.mock('../src/prisma', () => ({
  delivery: {
    findUnique: jest.fn()
  },
  $queryRaw: jest.fn()
}));

describe('Delivery Controller', () => {
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

  describe('getDelivery', () => {
    it('should return delivery when it exists', async () => {
      const mockDelivery = {
        delivery_id: 1,
        delivery_method: 'Нова пошта',
        delivery_address: 'вул. Срібнокільська 12',
        order_status: 'delivered'
      };

      req.params.id = '1';
      prisma.delivery.findUnique.mockResolvedValue(mockDelivery);

      await getDelivery(req, res);

      expect(prisma.delivery.findUnique).toHaveBeenCalledWith({
        where: { delivery_id: 1 }
      });
      expect(res.json).toHaveBeenCalledWith(mockDelivery);
    });

    it('should return 404 when delivery does not exist', async () => {
      req.params.id = '999';
      prisma.delivery.findUnique.mockResolvedValue(null);

      await getDelivery(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Delivery not found' });
    });
  });

  describe('getPopularDelivery', () => {
    it('should return delivery statistics with rankings', async () => {
      const mockStats = [
        {
          delivery_method: 'Нова пошта',
          total_orders: 150,
          percentage: 50.00,
          popularity_rank: 1
        },
        {
          delivery_method: 'Meest',
          total_orders: 100,
          percentage: 33.33,
          popularity_rank: 2
        },
        {
          delivery_method: 'Укрпошта',
          total_orders: 50,
          percentage: 16.67,
          popularity_rank: 3
        }
      ];

      prisma.$queryRaw.mockResolvedValue(mockStats);

      await getPopularDelivery(req, res);

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockStats);
    });

    it('should return empty array when no deliveries exist', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      await getPopularDelivery(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });
  });
});