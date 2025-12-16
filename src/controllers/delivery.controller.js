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

exports.getPopularDelivery = async (req, res) => {
  const result = await prisma.$queryRaw`
    WITH delivery_stats AS (
      SELECT
        d.delivery_method,
        COUNT(o.order_id) AS total_orders
      FROM delivery d
      JOIN orders o ON o.delivery_id = d.delivery_id
      GROUP BY d.delivery_method
    )
    SELECT
      delivery_method,
      total_orders,
      ROUND(
        total_orders * 100.0 / SUM(total_orders) OVER (),
        2
      ) AS percentage,
      RANK() OVER (ORDER BY total_orders DESC) AS popularity_rank
    FROM delivery_stats
    ORDER BY total_orders DESC;
  `;

  res.json(result);
};