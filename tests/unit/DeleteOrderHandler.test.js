const DeleteOrderHandler = require('../../application/commands/orders/DeleteOrderHandler');
const DeleteOrderCommand = require('../../application/commands/orders/DeleteOrderCommand');
const { NotFoundError, ValidationError } = require('../../domain/errors/DomainError');
const OrderFactory = require('../../domain/factories/OrderFactory');
const OrderItem = require('../../domain/value-objects/OrderItem');

function makeOrder(id, status) {
  return OrderFactory.reconstitute({
    id,
    userId: 1,
    items: [new OrderItem({ productId: 1, quantity: 1, price: 100 })],
    status,
    deliveryMethod: 'courier',
    deliveryAddress: 'Kyiv',
    paymentMethod: 'card',
    totalPrice: 100,
    createdAt: new Date(),
  });
}

class FakeOrderRepository {
  constructor(orders = []) {
    this._orders = [...orders];
    this.deletedId = null;
  }

  async findById(id) {
    return this._orders.find(o => o.getId() === id) || null;
  }

  async delete(id) {
    this.deletedId = id;
    this._orders = this._orders.filter(o => o.getId() !== id);
  }
}

async function run() {
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.log(`  ✗ ${name}`);
      console.log(`    ${err.message}`);
      failed++;
    }
  }

  function assert(cond, msg) {
    if (!cond) throw new Error(msg || 'Assertion failed');
  }

  console.log('\nDeleteOrderHandler — unit tests\n');

  await test('кидає NotFoundError якщо замовлення не знайдено', async () => {
    const handler = new DeleteOrderHandler(new FakeOrderRepository([]));
    let caught = null;
    try { await handler.handle(new DeleteOrderCommand({ orderId: 999 })); }
    catch (e) { caught = e; }
    assert(caught instanceof NotFoundError, 'NotFoundError');
  });

  await test('кидає ValidationError якщо статус не cancelled', async () => {
    const repo = new FakeOrderRepository([makeOrder(1, 'created')]);
    const handler = new DeleteOrderHandler(repo);
    let caught = null;
    try { await handler.handle(new DeleteOrderCommand({ orderId: 1 })); }
    catch (e) { caught = e; }
    assert(caught instanceof ValidationError, 'ValidationError для не-cancelled');
  });

  await test('успішно видаляє cancelled замовлення', async () => {
    const repo = new FakeOrderRepository([makeOrder(1, 'cancelled')]);
    const handler = new DeleteOrderHandler(repo);
    await handler.handle(new DeleteOrderCommand({ orderId: 1 }));
    assert(repo.deletedId === 1, 'delete викликано з правильним id');
    assert(repo._orders.length === 0, 'замовлення видалено');
  });

  console.log(`\nРезультат: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
