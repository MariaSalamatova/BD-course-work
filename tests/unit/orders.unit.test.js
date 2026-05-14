const v = require('valibot');

const OrderItemSchema = v.object({
  product_id: v.pipe(v.number(), v.integer('product_id must be an integer'), v.minValue(1)),
  quantity: v.pipe(v.number(), v.integer('quantity must be an integer'), v.minValue(1, 'quantity must be a positive integer'))
});

const CreateOrderSchema = v.object({
  delivery_method: v.picklist(['courier', 'pickup', 'post'], 'Invalid delivery_method. Must be: courier, pickup, post'),
  delivery_address: v.pipe(v.string(), v.minLength(1, 'delivery_address cannot be empty')),
  payment_method: v.picklist(['card', 'cash', 'online'], 'Invalid payment_method. Must be: card, cash, online'),
  items: v.pipe(v.array(OrderItemSchema), v.minLength(1, 'Order must contain at least one item'))
});

const RegisterSchema = v.object({
  email: v.pipe(v.string(), v.email('Invalid email format')),
  password: v.pipe(v.string(), v.minLength(6, 'Password must be at least 6 characters long')),
  name: v.pipe(v.string(), v.minLength(1, 'Name cannot be empty'))
});


function canUpdateOrder(order, currentStatus) {
  if (order.order_status === 'cancelled') {
    return { allowed: false, message: 'Cancelled order cannot be updated' };
  }
  if (order.order_status !== currentStatus) {
    return { allowed: false, message: 'Order status has changed. Please retry the operation.' };
  }
  return { allowed: true };
}

function canDeleteOrder(order) {
  if (order.order_status !== 'cancelled') {
    return { allowed: false, message: 'Only cancelled orders can be deleted' };
  }
  return { allowed: true };
}

describe('RegisterSchema-email validation', () => {
  test('валідний email проходить перевірку', () => {
    const result = v.safeParse(RegisterSchema, {
      email: 'user@example.com',
      password: 'secret123',
      name: 'Тест'
    });
    expect(result.success).toBe(true);
  });

  test('невалідний email повертає помилку', () => {
    const result = v.safeParse(RegisterSchema, {
      email: 'notanemail',
      password: 'secret123',
      name: 'Тест'
    });
    expect(result.success).toBe(false);
    expect(result.issues[0].message).toMatch(/Invalid email/);
  });

  test('email без домену повертає помилку', () => {
    const result = v.safeParse(RegisterSchema, {
      email: 'user@',
      password: 'secret123',
      name: 'Тест'
    });
    expect(result.success).toBe(false);
  });
});

describe('RegisterSchema-password validation', () => {
  test('пароль 6+ символів проходить', () => {
    const result = v.safeParse(RegisterSchema, {
      email: 'u@test.com',
      password: 'abcdef',
      name: 'Тест'
    });
    expect(result.success).toBe(true);
  });

  test('пароль менше 6 символів повертає помилку', () => {
    const result = v.safeParse(RegisterSchema, {
      email: 'u@test.com',
      password: '123',
      name: 'Тест'
    });
    expect(result.success).toBe(false);
    expect(result.issues[0].message).toMatch(/6 characters/);
  });

  test('порожній пароль повертає помилку', () => {
    const result = v.safeParse(RegisterSchema, {
      email: 'u@test.com',
      password: '',
      name: 'Тест'
    });
    expect(result.success).toBe(false);
  });
});

describe('CreateOrderSchema-items validation', () => {
  const base = {
    delivery_method: 'courier',
    delivery_address: 'вул. Хрещатик 1',
    payment_method: 'card'
  };

  test('валідне замовлення проходить перевірку', () => {
    const result = v.safeParse(CreateOrderSchema, {
      ...base,
      items: [{ product_id: 1, quantity: 2 }, { product_id: 5, quantity: 1 }]
    });
    expect(result.success).toBe(true);
  });

  test('порожній масив items повертає помилку', () => {
    const result = v.safeParse(CreateOrderSchema, { ...base, items: [] });
    expect(result.success).toBe(false);
    expect(result.issues[0].message).toMatch(/at least one item/);
  });

  test('quantity = 0 повертає помилку', () => {
    const result = v.safeParse(CreateOrderSchema, {
      ...base,
      items: [{ product_id: 1, quantity: 0 }]
    });
    expect(result.success).toBe(false);
    expect(result.issues[0].message).toMatch(/positive integer/);
  });

  test('від\'ємний quantity повертає помилку', () => {
    const result = v.safeParse(CreateOrderSchema, {
      ...base,
      items: [{ product_id: 1, quantity: -3 }]
    });
    expect(result.success).toBe(false);
  });

  test('дробовий quantity повертає помилку (не ціле число)', () => {
    const result = v.safeParse(CreateOrderSchema, {
      ...base,
      items: [{ product_id: 1, quantity: 1.5 }]
    });
    expect(result.success).toBe(false);
    expect(result.issues[0].message).toMatch(/integer/);
  });

  test('дробовий product_id повертає помилку', () => {
    const result = v.safeParse(CreateOrderSchema, {
      ...base,
      items: [{ product_id: 1.5, quantity: 1 }]
    });
    expect(result.success).toBe(false);
  });
});

describe('CreateOrderSchema-delivery_method validation', () => {
  const base = {
    delivery_address: 'вул. Хрещатик 1',
    payment_method: 'card',
    items: [{ product_id: 1, quantity: 1 }]
  };

  test.each(['courier', 'pickup', 'post'])('"%s" є валідним методом доставки', (method) => {
    const result = v.safeParse(CreateOrderSchema, { ...base, delivery_method: method });
    expect(result.success).toBe(true);
  });

  test('невалідний delivery_method повертає помилку', () => {
    const result = v.safeParse(CreateOrderSchema, { ...base, delivery_method: 'drone' });
    expect(result.success).toBe(false);
    expect(result.issues[0].message).toMatch(/delivery_method/);
  });
});

describe('CreateOrderSchema-payment_method validation', () => {
  const base = {
    delivery_method: 'courier',
    delivery_address: 'вул. Хрещатик 1',
    items: [{ product_id: 1, quantity: 1 }]
  };

  test.each(['card', 'cash', 'online'])('"%s" є валідним методом оплати', (method) => {
    const result = v.safeParse(CreateOrderSchema, { ...base, payment_method: method });
    expect(result.success).toBe(true);
  });

  test('невалідний payment_method повертає помилку', () => {
    const result = v.safeParse(CreateOrderSchema, { ...base, payment_method: 'crypto' });
    expect(result.success).toBe(false);
    expect(result.issues[0].message).toMatch(/payment_method/);
  });
});

describe('CreateOrderSchema-delivery_address validation', () => {
  const base = {
    delivery_method: 'courier',
    payment_method: 'card',
    items: [{ product_id: 1, quantity: 1 }]
  };

  test('порожній delivery_address повертає помилку', () => {
    const result = v.safeParse(CreateOrderSchema, { ...base, delivery_address: '' });
    expect(result.success).toBe(false);
    expect(result.issues[0].message).toMatch(/cannot be empty/);
  });
});


describe('canUpdateOrder-бізнес-правило оновлення статусу', () => {
  test('дозволяє оновлення коли статус збігається', () => {
    const result = canUpdateOrder({ order_status: 'created' }, 'created');
    expect(result.allowed).toBe(true);
  });

  test('блокує оновлення скасованого замовлення (409)', () => {
    const result = canUpdateOrder({ order_status: 'cancelled' }, 'cancelled');
    expect(result.allowed).toBe(false);
    expect(result.message).toMatch(/cancelled/i);
  });

  test('блокує оновлення при розбіжності статусу (optimistic lock, 409)', () => {
    const result = canUpdateOrder({ order_status: 'shipped' }, 'created');
    expect(result.allowed).toBe(false);
    expect(result.message).toMatch(/retry/i);
  });

  test('дозволяє оновлення з created → confirmed', () => {
    const result = canUpdateOrder({ order_status: 'created' }, 'created');
    expect(result.allowed).toBe(true);
  });
});

describe('canDeleteOrder-бізнес-правило видалення', () => {
  test('дозволяє видалення скасованого замовлення', () => {
    expect(canDeleteOrder({ order_status: 'cancelled' }).allowed).toBe(true);
  });

  test.each(['created', 'confirmed', 'shipped', 'delivered'])(
    'блокує видалення замовлення зі статусом "%s"',
    (status) => {
      const result = canDeleteOrder({ order_status: status });
      expect(result.allowed).toBe(false);
      expect(result.message).toMatch(/Only cancelled/);
    }
  );
});
