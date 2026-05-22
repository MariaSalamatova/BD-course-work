const CreateOrderHandler = require('../../application/commands/orders/CreateOrderHandler');
const CreateOrderCommand = require('../../application/commands/orders/CreateOrderCommand');
const { NotFoundError } = require('../../domain/errors/DomainError');

class FakeOrderRepository {
  constructor() {
    this.orders = [];
    this._nextId = 1;
  }

  async findById(id) {
    return this.orders.find(o => o.getId() === id) || null;
  }

  async findByUserId(userId) {
    return this.orders.filter(o => o.getUserId() === userId);
  }

  async save(order) {
    const plain = order.toPlain();
    plain.id = this._nextId++;

    const OrderFactory = require('../../domain/factories/OrderFactory');
    const saved = OrderFactory.reconstitute(plain);
    this.orders.push(saved);
    return saved;
  }

  async update(order) {
    const idx = this.orders.findIndex(o => o.getId() === order.getId());
    if (idx !== -1) this.orders[idx] = order;
    return order;
  }

  async delete(id) {
    this.orders = this.orders.filter(o => o.getId() !== id);
  }
}

class FakeUserRepository {
  constructor(users = []) {
    this._users = users;
  }

  async findById(id) {
    return this._users.find(u => u.id === id) || null;
  }

  async findByEmail(email) {
    return this._users.find(u => u.email === email) || null;
  }

  async save(user) {
    return user;
  }
}

class FakeOrderFactory {
  constructor(shouldSucceed = true) {
    this.shouldSucceed = shouldSucceed;
    this.createCalledWith = null;
  }

  async create(data) {
    this.createCalledWith = data;
    if (!this.shouldSucceed) {
      const { NotFoundError } = require('../../domain/errors/DomainError');
      throw new NotFoundError('Products not found: 999');
    }
    const { Order } = require('../../domain/models/Order');
    const OrderItem = require('../../domain/value-objects/OrderItem');
    const Money = require('../../domain/value-objects/Money');
    return new Order({
      userId: data.userId,
      items: [new OrderItem({ productId: 1, quantity: 1, price: 100 })],
      status: 'created',
      deliveryMethod: data.deliveryMethod,
      deliveryAddress: data.deliveryAddress,
      paymentMethod: data.paymentMethod,
      totalPrice: new Money(100),
    });
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

  function assert(condition, msg) {
    if (!condition) throw new Error(msg || 'Assertion failed');
  }

  console.log('\nCreateOrderHandler — unit tests\n');

  await test('кидає NotFoundError якщо юзер не знайдений', async () => {
    const handler = new CreateOrderHandler(
      new FakeOrderFactory(),
      new FakeOrderRepository(),
      new FakeUserRepository([])
    );

    const command = new CreateOrderCommand({
      userId: 999,
      deliveryMethod: 'courier',
      deliveryAddress: 'Kyiv, Khreshchatyk 1',
      paymentMethod: 'card',
      items: [{ product_id: 1, quantity: 2 }],
    });

    let caught = null;
    try { await handler.handle(command); }
    catch (e) { caught = e; }

    assert(caught instanceof NotFoundError, 'має бути NotFoundError');
    assert(caught.message === 'User not found', `неправильне повідомлення: ${caught.message}`);
  });

  await test('повертає ID замовлення при успішному створенні', async () => {
    const fakeUser = { id: 1, email: 'test@test.com' };
    const handler = new CreateOrderHandler(
      new FakeOrderFactory(true),
      new FakeOrderRepository(),
      new FakeUserRepository([fakeUser])
    );

    const command = new CreateOrderCommand({
      userId: 1,
      deliveryMethod: 'courier',
      deliveryAddress: 'Kyiv, Khreshchatyk 1',
      paymentMethod: 'card',
      items: [{ product_id: 1, quantity: 2 }],
    });

    const orderId = await handler.handle(command);
    assert(typeof orderId === 'number', `orderId має бути числом, отримано: ${typeof orderId}`);
    assert(orderId > 0, 'orderId має бути > 0');
  });

  await test('передає правильні дані в orderFactory', async () => {
    const fakeUser = { id: 1, email: 'test@test.com' };
    const factory = new FakeOrderFactory(true);
    const handler = new CreateOrderHandler(
      factory,
      new FakeOrderRepository(),
      new FakeUserRepository([fakeUser])
    );

    const command = new CreateOrderCommand({
      userId: 1,
      deliveryMethod: 'pickup',
      deliveryAddress: 'Lviv, Rynok sq 1',
      paymentMethod: 'cash',
      items: [{ product_id: 5, quantity: 3 }],
    });

    await handler.handle(command);

    assert(factory.createCalledWith.userId === 1, 'userId має бути 1');
    assert(factory.createCalledWith.deliveryMethod === 'pickup', 'deliveryMethod');
    assert(factory.createCalledWith.paymentMethod === 'cash', 'paymentMethod');
  });

  await test('кидає помилку якщо продукти не знайдені (через factory)', async () => {
    const fakeUser = { id: 1, email: 'test@test.com' };
    const handler = new CreateOrderHandler(
      new FakeOrderFactory(false),
      new FakeOrderRepository(),
      new FakeUserRepository([fakeUser])
    );

    const command = new CreateOrderCommand({
      userId: 1,
      deliveryMethod: 'courier',
      deliveryAddress: 'Kyiv',
      paymentMethod: 'card',
      items: [{ product_id: 999, quantity: 1 }],
    });

    let caught = null;
    try { await handler.handle(command); }
    catch (e) { caught = e; }

    assert(caught instanceof NotFoundError, 'має бути NotFoundError для продукту');
  });

  console.log(`\nРезультат: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
