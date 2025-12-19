const { getPayment } = require('../src/controllers/payment.controller');
const prisma = require('../src/prisma');

jest.mock('../src/prisma', () => ({
  payment: {
    findUnique: jest.fn()
  }
}));

describe('Payment Controller - getPayment', () => {
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

  it('should return payment when it exists', async () => {
    const mockPayment = {
      payment_id: 1,
      transaction_date: new Date('2024-01-01'),
      payment_method: 'Credit Card',
      payment_status: 'completed'
    };

    req.params.id = '1';
    prisma.payment.findUnique.mockResolvedValue(mockPayment);

    await getPayment(req, res);

    expect(prisma.payment.findUnique).toHaveBeenCalledWith({
      where: { payment_id: 1 }
    });
    expect(res.json).toHaveBeenCalledWith(mockPayment);
  });

  it('should return 404 when payment does not exist', async () => {
    req.params.id = '999';
    prisma.payment.findUnique.mockResolvedValue(null);

    await getPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Payment not found' });
  });
});