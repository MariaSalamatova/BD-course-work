/**
 * @interface IOrderRepository
 */
class IOrderRepository {
  /** @param {number} id @returns {Promise<Order|null>} */
  async findById(id) { throw new Error('Not implemented'); }

  /** @param {number} userId @param {{ page, limit }} options @returns {Promise<Order[]>} */
  async findByUserId(userId, options) { throw new Error('Not implemented'); }

  /** @param {Order} order @returns {Promise<Order>} */
  async save(order) { throw new Error('Not implemented'); }

  /** @param {Order} order @returns {Promise<Order>} */
  async update(order) { throw new Error('Not implemented'); }

  /** @param {number} id @returns {Promise<void>} */
  async delete(id) { throw new Error('Not implemented'); }
}

/**
 * @interface IUserRepository
 */
class IUserRepository {
  /** @param {number} id @returns {Promise<User|null>} */
  async findById(id) { throw new Error('Not implemented'); }

  /** @param {string} email @returns {Promise<User|null>} */
  async findByEmail(email) { throw new Error('Not implemented'); }

  /** @param {User} user @returns {Promise<User>} */
  async save(user) { throw new Error('Not implemented'); }
}

/**
 * @interface IProductRepository
 */
class IProductRepository {
  /** @param {number[]} ids @returns {Promise<Product[]>} */
  async findByIds(ids) { throw new Error('Not implemented'); }

  /** @param {number} categoryId @returns {Promise<Product[]>} */
  async findByCategoryId(categoryId) { throw new Error('Not implemented'); }
}

/**
 * @interface IDeliveryRepository
 */
class IDeliveryRepository {
  /** @returns {Promise<Array>} */
  async getPopularMethods() { throw new Error('Not implemented'); }
}

module.exports = { IOrderRepository, IUserRepository, IProductRepository, IDeliveryRepository };