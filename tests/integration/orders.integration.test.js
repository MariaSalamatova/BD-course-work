const request = require('supertest');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

jest.mock('../../src/prisma', () => ({
  users: { findUnique: jest.fn(), create: jest.fn() },
  orders: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  cart: { findUnique: jest.fn(), create: jest.fn() },
  cartitems: { create: jest.fn() },
  payment: { create: jest.fn(), findUnique: jest.fn() },
  delivery: { create: jest.fn(), findUnique: jest.fn() },
  product: { findMany: jest.fn(), findUnique: jest.fn() },
  $transaction: jest.fn(),
  $queryRaw: jest.fn()
}));

const app = require('../../src/app');
const prisma = require('../../src/prisma');

function makeToken(user_id = 1) {
  return jwt.sign({ user_id, email: 'test@example.com' }, JWT_SECRET, { expiresIn: '1h' });
}

beforeEach(() => jest.clearAllMocks());


describe('POST /api/auth/register', () => {
  test('201-успішна реєстрація', async () => {
    prisma.users.findUnique.mockResolvedValue(null);
    prisma.users.create.mockResolvedValue({
      user_id: 1, email: 'new@example.com', name: 'Новий', password: 'hashed'
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@example.com', password: 'password123', name: 'Новий' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('new@example.com');
  });

  test('400-невалідний email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bad-email', password: 'password123', name: 'Тест' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Invalid email/);
  });

  test('400-пароль коротший за 6 символів', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'u@test.com', password: '123', name: 'Тест' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/6 characters/);
  });

  test('409-email вже зайнятий', async () => {
    prisma.users.findUnique.mockResolvedValue({ user_id: 1, email: 'exists@test.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'exists@test.com', password: 'password123', name: 'Тест' });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already in use/);
  });
});

describe('POST /api/auth/login', () => {
  test('200-успішний вхід', async () => {
    const bcrypt = require('bcrypt');
    const hashed = await bcrypt.hash('password123', 10);
    prisma.users.findUnique.mockResolvedValue({
      user_id: 1, email: 'u@test.com', name: 'Тест', password: hashed
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'u@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('401-невірний пароль', async () => {
    const bcrypt = require('bcrypt');
    const hashed = await bcrypt.hash('correctpass', 10);
    prisma.users.findUnique.mockResolvedValue({
      user_id: 1, email: 'u@test.com', password: hashed
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'u@test.com', password: 'wrongpass' });

    expect(res.status).toBe(401);
  });

  test('401-користувач не існує', async () => {
    prisma.users.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@test.com', password: 'password123' });

    expect(res.status).toBe(401);
  });
});

describe('Захищені маршрути-401 без токена', () => {
  const routes = [
    ['get', '/api/cart/1'],
    ['get', '/api/delivery/1'],
    ['get', '/api/payment/1'],
    ['get', '/api/orders/user/1'],
    ['post', '/api/orders'],
    ['patch', '/api/orders/1/status'],
    ['delete', '/api/orders/1']
  ];

  test.each(routes)('%s %s повертає 401', async (method, route) => {
    const res = await request(app)[method](route);
    expect(res.status).toBe(401);
  });
});


describe('POST /api/orders', () => {
  const token = makeToken(1);

  test('201-успішне створення замовлення', async () => {
    const mockOrder = {
      order_id: 1, total_price: 200, order_status: 'created',
      cart: { cartitems: [] }, delivery: {}, payment: {}
    };

    prisma.$transaction.mockImplementation(async (fn) => fn({
      users: { findUnique: jest.fn().mockResolvedValue({ user_id: 1 }) },
      product: { findMany: jest.fn().mockResolvedValue([{ product_id: 1, price: 100 }]) },
      cart: { create: jest.fn().mockResolvedValue({ cart_id: 1 }) },
      cartitems: { create: jest.fn().mockResolvedValue({}) },
      payment: { create: jest.fn().mockResolvedValue({ payment_id: 1 }) },
      delivery: { create: jest.fn().mockResolvedValue({ delivery_id: 1 }) },
      orders: { create: jest.fn().mockResolvedValue(mockOrder) }
    }));

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        delivery_method: 'courier',
        delivery_address: 'вул. Хрещатик 1, Київ',
        payment_method: 'card',
        items: [{ product_id: 1, quantity: 2 }]
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('order_id');
  });

  test('400-відсутній delivery_method', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        delivery_address: 'вул. Хрещатик 1',
        payment_method: 'card',
        items: [{ product_id: 1, quantity: 1 }]
      });

    expect(res.status).toBe(400);
  });

  test('400-невалідний delivery_method', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        delivery_method: 'teleport',
        delivery_address: 'вул. Хрещатик 1',
        payment_method: 'card',
        items: [{ product_id: 1, quantity: 1 }]
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/delivery_method/);
  });

  test('400-порожній масив items', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        delivery_method: 'courier',
        delivery_address: 'вул. Хрещатик 1',
        payment_method: 'card',
        items: []
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/at least one item/);
  });

  test('400-дробовий quantity (не ціле число)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        delivery_method: 'courier',
        delivery_address: 'вул. Хрещатик 1',
        payment_method: 'card',
        items: [{ product_id: 1, quantity: 1.5 }]
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/integer/);
  });

  test('404-товар не знайдено', async () => {
    prisma.$transaction.mockImplementation(async (fn) => fn({
      users: { findUnique: jest.fn().mockResolvedValue({ user_id: 1 }) },
      product: { findMany: jest.fn().mockResolvedValue([]) }, // порожній результат
      cart: { create: jest.fn() },
      cartitems: { create: jest.fn() },
      payment: { create: jest.fn() },
      delivery: { create: jest.fn() },
      orders: { create: jest.fn() }
    }));

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        delivery_method: 'courier',
        delivery_address: 'вул. Хрещатик 1',
        payment_method: 'card',
        items: [{ product_id: 999, quantity: 1 }]
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Products not found/);
  });
});


describe('PATCH /api/orders/:orderId/status', () => {
  const token = makeToken(1);

  test('200-успішне оновлення статусу', async () => {
    prisma.$transaction.mockImplementation(async (fn) => fn({
      orders: {
        findUnique: jest.fn().mockResolvedValue({ order_id: 1, order_status: 'created' }),
        update: jest.fn().mockResolvedValue({ order_id: 1, order_status: 'confirmed' })
      }
    }));

    const res = await request(app)
      .patch('/api/orders/1/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'confirmed', currentStatus: 'created' });

    expect(res.status).toBe(200);
    expect(res.body.order_status).toBe('confirmed');
  });

  test('400-невалідний newStatus', async () => {
    const res = await request(app)
      .patch('/api/orders/1/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'flying', currentStatus: 'created' });

    expect(res.status).toBe(400);
  });

  test('404-замовлення не знайдено', async () => {
    prisma.$transaction.mockImplementation(async (fn) => fn({
      orders: { findUnique: jest.fn().mockResolvedValue(null) }
    }));

    const res = await request(app)
      .patch('/api/orders/999/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'confirmed', currentStatus: 'created' });

    expect(res.status).toBe(404);
  });

  test('409-замовлення вже скасовано', async () => {
    prisma.$transaction.mockImplementation(async (fn) => fn({
      orders: { findUnique: jest.fn().mockResolvedValue({ order_id: 1, order_status: 'cancelled' }) }
    }));

    const res = await request(app)
      .patch('/api/orders/1/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'confirmed', currentStatus: 'cancelled' });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/cancelled/i);
  });

  test('409-оптимістичне блокування (статус змінився)', async () => {
    prisma.$transaction.mockImplementation(async (fn) => fn({
      orders: { findUnique: jest.fn().mockResolvedValue({ order_id: 1, order_status: 'shipped' }) }
    }));

    const res = await request(app)
      .patch('/api/orders/1/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'confirmed', currentStatus: 'created' });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/retry/i);
  });
});


describe('DELETE /api/orders/:orderId', () => {
  const token = makeToken(1);

  test('200-успішне видалення скасованого замовлення', async () => {
    prisma.$transaction.mockImplementation(async (fn) => fn({
      orders: {
        findUnique: jest.fn().mockResolvedValue({ order_id: 1, order_status: 'cancelled' }),
        delete: jest.fn().mockResolvedValue({})
      }
    }));

    const res = await request(app)
      .delete('/api/orders/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  test('400-спроба видалити активне замовлення', async () => {
    prisma.$transaction.mockImplementation(async (fn) => fn({
      orders: { findUnique: jest.fn().mockResolvedValue({ order_id: 1, order_status: 'created' }) }
    }));

    const res = await request(app)
      .delete('/api/orders/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Only cancelled/);
  });

  test('404-замовлення не знайдено', async () => {
    prisma.$transaction.mockImplementation(async (fn) => fn({
      orders: { findUnique: jest.fn().mockResolvedValue(null) }
    }));

    const res = await request(app)
      .delete('/api/orders/999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/cart/:id', () => {
  const token = makeToken(1);

  test('200-повертає кошик з товарами', async () => {
    prisma.cart.findUnique.mockResolvedValue({ cart_id: 1, user_id: 1, cartitems: [] });

    const res = await request(app)
      .get('/api/cart/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.cart_id).toBe(1);
  });

  test('404-кошик не знайдено', async () => {
    prisma.cart.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/cart/999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});


describe('GET /api/payment/:id', () => {
  const token = makeToken(1);

  test('200-повертає платіж', async () => {
    prisma.payment.findUnique.mockResolvedValue({
      payment_id: 1, payment_method: 'card', payment_status: 'pending'
    });

    const res = await request(app)
      .get('/api/payment/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.payment_id).toBe(1);
  });

  test('404-платіж не знайдено', async () => {
    prisma.payment.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/payment/999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});


describe('GET /api/delivery/:id', () => {
  const token = makeToken(1);

  test('200-повертає доставку', async () => {
    prisma.delivery.findUnique.mockResolvedValue({
      delivery_id: 1, delivery_method: 'courier', delivery_address: 'Київ'
    });

    const res = await request(app)
      .get('/api/delivery/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.delivery_id).toBe(1);
  });

  test('404-доставку не знайдено', async () => {
    prisma.delivery.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/delivery/999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
