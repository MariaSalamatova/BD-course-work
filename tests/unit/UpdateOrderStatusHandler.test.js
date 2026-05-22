const UpdateOrderStatusHandler = require('../../application/commands/orders/UpdateOrderStatusHandler');
const UpdateOrderStatusCommand = require('../../application/commands/orders/UpdateOrderStatusCommand');
const { NotFoundError, ConflictError, ValidationError } = require('../../domain/errors/DomainError');
const { Order } = require('../../domain/models/Order');
const OrderItem = require('../../domain/value-objects/OrderItem');
const Money = require('../../domain/value-objects/Money');

function makeOrder({ id = 1, status = 'created' } = {}) {
  return new Order({
    id,
    userId: 10,
    items: [new OrderItem({ productId: 1, quantity: 1, price: 100 })],
    status,
    deliveryMethod: 'courier',
    deliveryAddress: 'Kyiv',
    paymentMethod: 'card',
    totalPrice: new Money(100),
  });
}

class FakeOrderRepository {
  constructor(orders = []) {
    this._orders = orders;
    this.updateCalledWith = null;
  }

  async findById(id) {
    return this._orders.find(o => o.getId() === id) || null;
  }

  async update(order) {
    this.updateCalledWith = order;
    return order;
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

  console.log('\nUpdateOrderStatusHandler — unit tests\n');

  await test('кидає NotFoundError якщо замовлення не існує', async () => {
    const handler = new UpdateOrderStatusHandler(new FakeOrderRepository([]));
    const command = new UpdateOrderStatusCommand({ orderId: 99, newStatus: 'confirmed', currentStatus: 'created' });

    let caught = null;
    try { await handler.handle(command); } catch (e) { caught = e; }

    assert(caught instanceof NotFoundError, 'має бути NotFoundError');
  });

  await test('успішно оновлює статус і викликає repository.update', async () => {
    const order = makeOrder({ id: 1, status: 'created' });
    const repo = new FakeOrderRepository([order]);
    const handler = new UpdateOrderStatusHandler(repo);

    const command = new UpdateOrderStatusCommand({
      orderId: 1,
      newStatus: 'confirmed',
      currentStatus: 'created',
    });

    await handler.handle(command);

    assert(repo.updateCalledWith !== null, 'update має бути викликаний');
    assert(repo.updateCalledWith.getStatus() === 'confirmed', 'статус має бути confirmed');
  });

  await test('кидає ConflictError якщо currentStatus не збігається (optimistic lock)', async () => {
    const order = makeOrder({ id: 1, status: 'shipped' }); // в БД вже shipped
    const handler = new UpdateOrderStatusHandler(new FakeOrderRepository([order]));

    const command = new UpdateOrderStatusCommand({
      orderId: 1,
      newStatus: 'confirmed',
      currentStatus: 'created', // клієнт думає що created, але вже shipped
    });

    let caught = null;
    try { await handler.handle(command); } catch (e) { caught = e; }

    assert(caught instanceof ConflictError, `має бути ConflictError, отримано: ${caught?.constructor.name}`);
  });

  await test('кидає ConflictError якщо замовлення вже скасоване', async () => {
    const order = makeOrder({ id: 1, status: 'cancelled' });
    const handler = new UpdateOrderStatusHandler(new FakeOrderRepository([order]));

    const command = new UpdateOrderStatusCommand({
      orderId: 1,
      newStatus: 'confirmed',
      currentStatus: 'cancelled',
    });

    let caught = null;
    try { await handler.handle(command); } catch (e) { caught = e; }

    assert(caught instanceof ConflictError, 'скасоване замовлення не можна оновити');
  });

  await test('кидає ValidationError для невалідного нового статусу', async () => {
    const order = makeOrder({ id: 1, status: 'created' });
    const handler = new UpdateOrderStatusHandler(new FakeOrderRepository([order]));

    const command = new UpdateOrderStatusCommand({
      orderId: 1,
      newStatus: 'flying',
      currentStatus: 'created',
    });

    let caught = null;
    try { await handler.handle(command); } catch (e) { caught = e; }

    assert(caught instanceof ValidationError, 'має бути ValidationError для невалідного статусу');
  });

  console.log(`\nРезультат: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
