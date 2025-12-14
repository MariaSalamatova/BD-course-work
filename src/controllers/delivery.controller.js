const prisma = require('../prisma');

exports.getDelivery = async (req, res) => {
  const id = Number(req.params.id);

  const delivery = await prisma.delivery.findUnique({
    where: { delivery_id: id }
  });

  if (!delivery) {
    return res.status(404).json({ message: 'Delivery not found' });
  }

  res.json(delivery);
};