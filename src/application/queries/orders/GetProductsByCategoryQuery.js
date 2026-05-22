class GetProductsByCategoryQuery {
  /**
   * @param {object} data
   * @param {number} data.categoryId
   */
  constructor({ categoryId }) {
    this.categoryId = categoryId;
  }
}

class GetProductsByCategoryHandler {
  /**
   * @param {import('../../../domain/repositories').IProductRepository} productRepository
   */
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  /**
   * @param {GetProductsByCategoryQuery} query
   * @returns {Promise<Array>} Read Model
   */
  async handle(query) {
    return this.productRepository.findByCategoryId(query.categoryId);
  }
}

module.exports = { GetProductsByCategoryQuery, GetProductsByCategoryHandler };
