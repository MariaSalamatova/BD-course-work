const { Order } = require('../../domain/models/Order');
const User = require('../../domain/models/User');
const Email = require('../../domain/value-objects/Email');
const Money = require('../../domain/value-objects/Money');
const OrderItem = require('../../domain/value-objects/OrderItem');
const OrderFactory = require('../../domain/factories/OrderFactory');
const { ValidationError, ConflictError, NotFoundError } = require('../../domain/errors/DomainError');

function makeValidOrder(overrides = {}) {
  return new Order({
    userId: 1,
    items: [new OrderItem({ productId: 1, quantity: 2, price: 100 })],
    status: 'created',
    deliveryMethod: 'courier',
    deliveryAddress: 'вул. Хрещатик 1, Київ',
    paymentMethod: 'card',
    totalPrice: new Money(200),
    ...overrides
  });
}

describe('Email — value object', () => {
  test('валідний email створюється', () => {
    const email = new Email('User@Example.COM');
    expect(email.getValue()).toBe('user@example.com'); // нормалізація
  });

  test('невалідний email кидає ValidationError', () => {
    expect(() => new Email('notanemail')).toThrow(ValidationError);
    expect(() => new Email('')).toThrow(ValidationError);
    expect(() => new Email(null)).toThrow(ValidationError);
  });

  test('equals порівнює за значенням', () => {
    const a = new Email('test@example.com');
    const b = new Email('TEST@EXAMPLE.COM');
    expect(a.equals(b)).toBe(true);
  });
});

describe('Money — value object', () => {
  test('коректна сума створюється', () => {
    expect(new Money(100).getAmount()).toBe(100);
    expect(new Money(0).getAmount()).toBe(0);
  });

  test('від\'ємна сума кидає ValidationError', () => {
    expect(() => new Money(-1)).toThrow(ValidationError);
  });

  test('add складає дві суми', () => {
    const result = new Money(100).add(new Money(50));
    expect(result.getAmount()).toBe(150);
  });

  test('округлення до копійок', () => {
    expect(new Money(10.005).getAmount()).toBe(10.01);
  });
});

describe('OrderItem — value object', () => {
  test('валідний item створюється', () => {
    const item = new OrderItem({ productId: 1, quantity: 3, price: 50 });
    expect(item.getSubtotal()).toBe(150);
  });

  test('quantity = 0 кидає ValidationError', () => {
    expect(() => new OrderItem({ productId: 1, quantity: 0, price: 10 })).toThrow(ValidationError);
  });

  test('дробовий quantity кидає ValidationError', () => {
    expect(() => new OrderItem({ productId: 1, quantity: 1.5, price: 10 })).toThrow(ValidationError);
  });

  test('від\'ємний product_id кидає ValidationError', () => {
    expect(() => new OrderItem({ productId: -1, quantity: 1, price: 10 })).toThrow(ValidationError);
  });
});

describe('Order — створення з інваріантами', () => {
  test('валідне замовлення створюється', () => {
    const order = makeValidOrder();
    expect(order.getStatus()).toBe('created');
    expect(order.getDeliveryMethod()).toBe('courier');
  });

  test('невалідний delivery_method кидає ValidationError', () => {
    expect(() => makeValidOrder({ deliveryMethod: 'drone' })).toThrow(ValidationError);
  });

  test('невалідний payment_method кидає ValidationError', () => {
    expect(() => makeValidOrder({ paymentMethod: 'crypto' })).toThrow(ValidationError);
  });

  test('порожній delivery_address кидає ValidationError', () => {
    expect(() => makeValidOrder({ deliveryAddress: '' })).toThrow(ValidationError);
    expect(() => makeValidOrder({ deliveryAddress: '   ' })).toThrow(ValidationError);
  });

  test('порожній items кидає ValidationError', () => {
    expect(() => makeValidOrder({ items: [] })).toThrow(ValidationError);
  });
});

describe('Order.updateStatus — бізнес-правила', () => {
  test('успішне оновлення статусу', () => {
    const order = makeValidOrder({ status: 'created' });
    order.updateStatus('confirmed', 'created');
    expect(order.getStatus()).toBe('confirmed');
  });

  test('оновлення скасованого замовлення кидає ConflictError', () => {
    const order = makeValidOrder({ status: 'cancelled' });
    expect(() => order.updateStatus('confirmed', 'cancelled')).toThrow(ConflictError);
  });

  test('optimistic lock: статус змінився — кидає ConflictError', () => {
    const order = makeValidOrder({ status: 'shipped' });
    expect(() => order.updateStatus('confirmed', 'created')).toThrow(ConflictError);
    expect(order.getStatus()).toBe('shipped'); // статус не змінився
  });

  test('невалідний newStatus кидає ValidationError', () => {
    const order = makeValidOrder({ status: 'created' });
    expect(() => order.updateStatus('flying', 'created')).toThrow(ValidationError);
  });
});

describe('Order.canBeDeleted — бізнес-правило', () => {
  test('скасоване замовлення можна видалити', () => {
    expect(makeValidOrder({ status: 'cancelled' }).canBeDeleted()).toBe(true);
  });

  test.each(['created', 'confirmed', 'shipped', 'delivered'])(
    'замовлення зі статусом "%s" не можна видалити',
    (status) => {
      expect(makeValidOrder({ status }).canBeDeleted()).toBe(false);
    }
  );
});

describe('User — створення', () => {
  test('валідний user створюється', () => {
    const user = new User({ email: 'u@test.com', name: 'Іван', passwordHash: 'hash' });
    expect(user.getEmail().getValue()).toBe('u@test.com');
    expect(user.getName()).toBe('Іван');
  });

  test('порожнє ім\'я кидає ValidationError', () => {
    expect(() => new User({ email: 'u@test.com', name: '', passwordHash: 'h' })).toThrow(ValidationError);
  });

  test('невалідний email кидає ValidationError', () => {
    expect(() => new User({ email: 'bad', name: 'Іван', passwordHash: 'h' })).toThrow(ValidationError);
  });
});

describe('OrderFactory — перевірка інваріантів через репозиторій', () => {
  function makeProductRepo(products) {
    return { findByIds: jest.fn().mockResolvedValue(products) };
  }

  test('успішно створює Order коли всі товари знайдені', async () => {
    const repo = makeProductRepo([{ id: 1, price: 50 }, { id: 2, price: 30 }]);
    const factory = new OrderFactory(repo);

    const order = await factory.create({
      userId: 1,
      deliveryMethod: 'courier',
      deliveryAddress: 'Київ',
      paymentMethod: 'card',
      items: [{ product_id: 1, quantity: 2 }, { product_id: 2, quantity: 1 }]
    });

    expect(order.getTotalPrice().getAmount()).toBe(130);
    expect(order.getItems()).toHaveLength(2);
  });

  test('кидає NotFoundError якщо товар не знайдено', async () => {
    const repo = makeProductRepo([]);
    const factory = new OrderFactory(repo);

    await expect(factory.create({
      userId: 1,
      deliveryMethod: 'courier',
      deliveryAddress: 'Київ',
      paymentMethod: 'card',
      items: [{ product_id: 999, quantity: 1 }]
    })).rejects.toThrow(NotFoundError);
  });

  test('інваріанти Order перевіряються в конструкторі', async () => {
    const repo = makeProductRepo([{ id: 1, price: 50 }]);
    const factory = new OrderFactory(repo);

    await expect(factory.create({
      userId: 1,
      deliveryMethod: 'drone',
      deliveryAddress: 'Київ',
      paymentMethod: 'card',
      items: [{ product_id: 1, quantity: 1 }]
    })).rejects.toThrow(ValidationError);
  });
});
