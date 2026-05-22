const { GetUserOrdersQuery, GetUserOrdersHandler } = require('../../application/queries/orders/GetUserOrdersQuery');

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

  console.log('\nGetUserOrdersHandler — integration tests\n');

  await test('Query правильно формує об\'єкт із дефолтними значеннями', () => {
    const query = new GetUserOrdersQuery({ userId: 5 });
    assert(query.userId === 5, 'userId');
    assert(query.page === 1, 'page default = 1');
    assert(query.limit === 10, 'limit default = 10');
  });

  await test('Query приймає кастомні page та limit', () => {
    const query = new GetUserOrdersQuery({ userId: 5, page: 3, limit: 25 });
    assert(query.page === 3, 'page');
    assert(query.limit === 25, 'limit');
  });

  await test('Handler повертає Read Model з правильними полями', async () => {
    const { Order } = require('../../domain/models/Order');
    const OrderItem = require('../../domain/value-objects/OrderItem');
    const Money = require('../../domain/value-objects/Money');
    const OrderFactory = require('../../domain/factories/OrderFactory');

    const fakeOrder = OrderFactory.reconstitute({
      id: 42,
      userId: 5,
      items: [new OrderItem({ productId: 1, quantity: 2, price: 150 })],
      status: 'confirmed',
      deliveryMethod: 'courier',
      deliveryAddress: 'Kyiv, Khreshchatyk 1',
      paymentMethod: 'card',
      totalPrice: 300,
      createdAt: new Date('2025-01-15'),
    });

    const fakeRepo = {
      findByUserId: async (userId, opts) => {
        assert(userId === 5, 'передається правильний userId');
        assert(opts.page === 1, 'передається page');
        assert(opts.limit === 10, 'передається limit');
        return [fakeOrder];
      }
    };

    const handler = new GetUserOrdersHandler(fakeRepo);
    const query = new GetUserOrdersQuery({ userId: 5 });
    const result = await handler.handle(query);

    assert(Array.isArray(result), 'результат має бути масивом');
    assert(result.length === 1, 'один запис');

    const dto = result[0];

    assert('order_id' in dto, 'поле order_id');
    assert('status' in dto, 'поле status');
    assert('delivery_method' in dto, 'поле delivery_method');
    assert('delivery_address' in dto, 'поле delivery_address');
    assert('payment_method' in dto, 'поле payment_method');
    assert('total_price' in dto, 'поле total_price');
    assert('items_count' in dto, 'поле items_count');
    assert('created_at' in dto, 'поле created_at');

    assert(dto.order_id === 42, `order_id має бути 42, отримано ${dto.order_id}`);
    assert(dto.status === 'confirmed', 'status');
    assert(dto.total_price === 300, 'total_price');
    assert(dto.items_count === 1, 'items_count');
  });

  await test('Handler не мутує стан — повторний виклик повертає ті самі дані', async () => {
    const OrderFactory = require('../../domain/factories/OrderFactory');
    const OrderItem = require('../../domain/value-objects/OrderItem');

    const fakeOrder = OrderFactory.reconstitute({
      id: 1, userId: 1,
      items: [new OrderItem({ productId: 1, quantity: 1, price: 50 })],
      status: 'created',
      deliveryMethod: 'pickup', deliveryAddress: 'Kyiv',
      paymentMethod: 'cash', totalPrice: 50, createdAt: new Date(),
    });

    let callCount = 0;
    const fakeRepo = {
      findByUserId: async () => { callCount++; return [fakeOrder]; }
    };

    const handler = new GetUserOrdersHandler(fakeRepo);
    const query = new GetUserOrdersQuery({ userId: 1 });

    const r1 = await handler.handle(query);
    const r2 = await handler.handle(query);

    assert(callCount === 2, 'репозиторій викликається кожен раз (no cache)');
    assert(r1[0].status === r2[0].status, 'результати ідентичні');
    assert(r1[0].order_id === r2[0].order_id, 'ті самі дані');
  });

  console.log(`\nРезультат: ${passed} passed, ${failed} failed\n`);

  if (passed + failed > 0) {
    console.log('──────────────────────────────────────────────────');
    console.log('Для повних integration-тестів із реальною БД:');
    console.log('  DATABASE_URL=postgresql://... node tests/integration/getUserOrders.test.js');
    console.log('──────────────────────────────────────────────────\n');
  }

  process.exit(failed > 0 ? 1 : 0);
}

run();
