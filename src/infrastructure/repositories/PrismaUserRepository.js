const { IUserRepository, IProductRepository, IDeliveryRepository } = require('../../domain/repositories');
const UserMapper = require('../mappers/UserMapper');

class PrismaUserRepository extends IUserRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async findById(id) {
    const record = await this.prisma.users.findUnique({ where: { user_id: id } });
    return record ? UserMapper.toDomain(record) : null;
  }

  async findByEmail(email) {
    const record = await this.prisma.users.findUnique({ where: { email } });
    return record ? UserMapper.toDomain(record) : null;
  }

  async save(user) {
    const record = await this.prisma.users.create({
      data: {
        email: user.getEmail().getValue(),
        name: user.getName(),
        password: user.getPasswordHash()
      }
    });
    return UserMapper.toDomain(record);
  }
}

class PrismaProductRepository extends IProductRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async findByIds(ids) {
    const records = await this.prisma.product.findMany({
      where: { product_id: { in: ids } }
    });
    return records.map(r => ({ id: r.product_id, price: r.price, name: r.name }));
  }

  async findByCategoryId(categoryId) {
    return this.prisma.product.findMany({
      where: {
        productcategoryconnection: { some: { category_id: categoryId } }
      },
      orderBy: { price: 'asc' }
    });
  }
}

class PrismaDeliveryRepository extends IDeliveryRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async findById(id) {
    return this.prisma.delivery.findUnique({ where: { delivery_id: id } });
  }

  async getPopularMethods() {
    return this.prisma.$queryRaw`
      WITH delivery_stats AS (
        SELECT d.delivery_method, COUNT(o.order_id) AS total_orders
        FROM delivery d
        JOIN orders o ON o.delivery_id = d.delivery_id
        GROUP BY d.delivery_method
      )
      SELECT
        delivery_method, total_orders,
        ROUND(total_orders * 100.0 / SUM(total_orders) OVER (), 2) AS percentage,
        RANK() OVER (ORDER BY total_orders DESC) AS popularity_rank
      FROM delivery_stats
      ORDER BY total_orders DESC;
    `;
  }
}

module.exports = { PrismaUserRepository, PrismaProductRepository, PrismaDeliveryRepository };
