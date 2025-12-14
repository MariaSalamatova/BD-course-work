const prisma = require('../prisma');

exports.getPayment = async (req, res) => {
  const id = Number(req.params.id);

  const payment = await prisma.payment.findUnique({
    where: { payment_id: id }
  });

  if (!payment) {
    return res.status(404).json({ message: 'Payment not found' });
  }

  res.json(payment);
};