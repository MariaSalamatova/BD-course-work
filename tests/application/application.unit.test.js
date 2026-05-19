const CreateOrderUseCase = require('../../application/orders/CreateOrderUseCase');
const UpdateOrderStatusUseCase = require('../../application/orders/UpdateOrderStatusUseCase');
// FIX: додано GetUserOrdersUseCase до тестів — раніше імпортувався але не тестувався
const { DeleteOrderUseCase, GetUserOrdersUseCase } = require('../../application/orders/orders.usecases');
// FIX: додано LoginUseCase до тестів — раніше імпортувався але не тестувався
const { RegisterUseCase, LoginUseCase } = require('../../application/auth/auth.usecases');
const OrderFactory = require('../../domain/factories/OrderFactory');
const { Order } = require('../../domain/models/Order');
const User = require('../../domain/models/User');
const OrderItem = require('../../domain/value-objects/OrderItem');
const Money = require('../../domain/value-objects/Money');
const { NotFoundError, ConflictError, ValidationError } = require('../../domain/errors/DomainError');

// ---------------------------------------------------------------------------
// Фабрики моків
// ---------------------------------------------------------------------------

function makeOrderRepo(overrides = {}) {
  return {
    findById: jest.fn(),
    findByUserId: jest.fn(),
    save: jest.fn(order => Promise.resolve(order)),
    update: jest.fn(order => Promise.resolve(order)),
    delete: jest.fn(),
    ...overrides
  };
}

function makeUserRepo(overrides = {}) {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    save: jest.fn(),
    ...overrides
  };
}

function makeProductRepo(products = []) {
  return { findByIds: jest.fn().mockResolvedValue(products) };
}

function makeValidOrder(statusOverride = 'created') {
  return new Order({
    id: 1,
    userId: 1,
    items: [new OrderItem({ productId: 1, quantity: 1, price: 100 })],
    status: statusOverride,
    deliveryMethod: 'courier',
    deliveryAddress: 'Київ',
    paymentMethod: 'card',
    totalPrice: new Money(100)
  });
}

// ---------------------------------------------------------------------------
// CreateOrderUseCase
// ---------------------------------------------------------------------------

describe('CreateOrderUseCase', () => {
  test('успішно створює замовлення зі статусом created та правильною сумою', async () => {
    const userRepo = makeUserRepo({
      findById: jest.fn().mockResolvedValue(new User({ id: 1, email: 'u@t.com', name: 'Test', passwordHash: 'h' }))
    });
    const orderRepo = makeOrderRepo();
    const productRepo = makeProductRepo([{ id: 1, price: 100 }]);
    const factory = new OrderFactory(productRepo);
    const useCase = new CreateOrderUseCase(factory, orderRepo, userRepo);

    const order = await useCase.execute({
      userId: 1,
      deliveryMethod: 'courier',
      deliveryAddress: 'Київ',
      paymentMethod: 'card',
      items: [{ product_id: 1, quantity: 1 }]
    });

    expect(orderRepo.save).toHaveBeenCalledTimes(1);
    expect(order.getStatus()).toBe('created');
    expect(order.getTotalPrice().getAmount()).toBe(100);
  });

  test('кидає NotFoundError якщо користувач не існує', async () => {
    const userRepo = makeUserRepo({ findById: jest.fn().mockResolvedValue(null) });
    const useCase = new CreateOrderUseCase(new OrderFactory(makeProductRepo()), makeOrderRepo(), userRepo);

    await expect(useCase.execute({
      userId: 999,
      deliveryMethod: 'courier',
      deliveryAddress: 'Київ',
      paymentMethod: 'card',
      items: [{ product_id: 1, quantity: 1 }]
    })).rejects.toThrow(NotFoundError);
  });

  test('кидає NotFoundError якщо товар не знайдено в репозиторії', async () => {
    const userRepo = makeUserRepo({
      findById: jest.fn().mockResolvedValue(new User({ id: 1, email: 'u@t.com', name: 'T', passwordHash: 'h' }))
    });
    const productRepo = makeProductRepo([]);
    const useCase = new CreateOrderUseCase(new OrderFactory(productRepo), makeOrderRepo(), userRepo);

    await expect(useCase.execute({
      userId: 1,
      deliveryMethod: 'courier',
      deliveryAddress: 'Київ',
      paymentMethod: 'card',
      items: [{ product_id: 999, quantity: 1 }]
    })).rejects.toThrow(NotFoundError);
  });
});

// ---------------------------------------------------------------------------
// UpdateOrderStatusUseCase
// ---------------------------------------------------------------------------

describe('UpdateOrderStatusUseCase', () => {
  test('успішно оновлює статус замовлення', async () => {
    const order = makeValidOrder('created');
    const orderRepo = makeOrderRepo({ findById: jest.fn().mockResolvedValue(order) });
    const useCase = new UpdateOrderStatusUseCase(orderRepo);

    await useCase.execute({ orderId: 1, newStatus: 'confirmed', currentStatus: 'created' });

    expect(orderRepo.update).toHaveBeenCalledTimes(1);
    expect(order.getStatus()).toBe('confirmed');
  });

  test('кидає NotFoundError якщо замовлення не існує', async () => {
    const orderRepo = makeOrderRepo({ findById: jest.fn().mockResolvedValue(null) });
    const useCase = new UpdateOrderStatusUseCase(orderRepo);

    await expect(
      useCase.execute({ orderId: 999, newStatus: 'confirmed', currentStatus: 'created' })
    ).rejects.toThrow(NotFoundError);
  });

  test('кидає ConflictError при спробі оновити скасоване замовлення', async () => {
    const order = makeValidOrder('cancelled');
    const orderRepo = makeOrderRepo({ findById: jest.fn().mockResolvedValue(order) });
    const useCase = new UpdateOrderStatusUseCase(orderRepo);

    await expect(
      useCase.execute({ orderId: 1, newStatus: 'confirmed', currentStatus: 'cancelled' })
    ).rejects.toThrow(ConflictError);
  });
});

// ---------------------------------------------------------------------------
// DeleteOrderUseCase
// ---------------------------------------------------------------------------

describe('DeleteOrderUseCase', () => {
  test('успішно видаляє скасоване замовлення', async () => {
    const order = makeValidOrder('cancelled');
    const orderRepo = makeOrderRepo({ findById: jest.fn().mockResolvedValue(order) });
    const useCase = new DeleteOrderUseCase(orderRepo);

    await useCase.execute({ orderId: 1 });
    expect(orderRepo.delete).toHaveBeenCalledWith(1);
  });

  test('кидає ValidationError при спробі видалити не скасоване замовлення', async () => {
    const order = makeValidOrder('created');
    const orderRepo = makeOrderRepo({ findById: jest.fn().mockResolvedValue(order) });
    const useCase = new DeleteOrderUseCase(orderRepo);

    await expect(useCase.execute({ orderId: 1 })).rejects.toThrow(ValidationError);
    expect(orderRepo.delete).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// GetUserOrdersUseCase
// FIX: раніше імпортувався але повністю не тестувався
// ---------------------------------------------------------------------------

describe('GetUserOrdersUseCase', () => {
  test('повертає список замовлень для існуючого користувача', async () => {
    const orders = [makeValidOrder('created'), makeValidOrder('shipped')];
    const orderRepo = makeOrderRepo({ findByUserId: jest.fn().mockResolvedValue(orders) });
    const useCase = new GetUserOrdersUseCase(orderRepo);

    const result = await useCase.execute({ userId: 1 });

    expect(orderRepo.findByUserId).toHaveBeenCalledWith(1);
    expect(result).toHaveLength(2);
  });

  test('повертає порожній масив якщо у користувача немає замовлень', async () => {
    const orderRepo = makeOrderRepo({ findByUserId: jest.fn().mockResolvedValue([]) });
    const useCase = new GetUserOrdersUseCase(orderRepo);

    const result = await useCase.execute({ userId: 1 });

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// RegisterUseCase
// FIX: mockHasher та mockToken перенесено всередину beforeEach щоб уникнути
// крихкого стану між тестами при повторному виклику jest.clearAllMocks()
// ---------------------------------------------------------------------------

describe('RegisterUseCase', () => {
  let mockHasher;
  let mockToken;

  beforeEach(() => {
    jest.clearAllMocks();
    mockHasher = { hash: jest.fn().mockResolvedValue('hashed'), compare: jest.fn() };
    mockToken = { generate: jest.fn().mockReturnValue('token123') };
  });

  test('успішна реєстрація повертає токен та дані користувача', async () => {
    const userRepo = makeUserRepo({
      findByEmail: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(
        new User({ id: 1, email: 'u@test.com', name: 'Тест', passwordHash: 'hashed' })
      )
    });
    const useCase = new RegisterUseCase(userRepo, mockHasher, mockToken);

    const result = await useCase.execute({ email: 'u@test.com', password: 'secret123', name: 'Тест' });

    expect(result.token).toBe('token123');
    expect(result.user.email).toBe('u@test.com');
  });

  test('кидає ValidationError при невалідному email', async () => {
    const useCase = new RegisterUseCase(makeUserRepo(), mockHasher, mockToken);
    await expect(
      useCase.execute({ email: 'bademail', password: 'secret123', name: 'Тест' })
    ).rejects.toThrow(ValidationError);
  });

  test('кидає ValidationError при короткому паролі (менше мінімальної довжини)', async () => {
    const useCase = new RegisterUseCase(makeUserRepo(), mockHasher, mockToken);
    await expect(
      useCase.execute({ email: 'u@test.com', password: '123', name: 'Тест' })
    ).rejects.toThrow(ValidationError);
  });

  test('кидає ConflictError якщо email вже зареєстрований', async () => {
    const userRepo = makeUserRepo({
      findByEmail: jest.fn().mockResolvedValue(
        new User({ id: 1, email: 'u@test.com', name: 'Існуючий', passwordHash: 'h' })
      )
    });
    const useCase = new RegisterUseCase(userRepo, mockHasher, mockToken);

    await expect(
      useCase.execute({ email: 'u@test.com', password: 'secret123', name: 'Тест' })
    ).rejects.toThrow(ConflictError);
  });
});

// ---------------------------------------------------------------------------
// LoginUseCase
// FIX: раніше імпортувався але повністю не тестувався
// ---------------------------------------------------------------------------

describe('LoginUseCase', () => {
  let mockHasher;
  let mockToken;

  beforeEach(() => {
    jest.clearAllMocks();
    mockHasher = { hash: jest.fn().mockResolvedValue('hashed'), compare: jest.fn() };
    mockToken = { generate: jest.fn().mockReturnValue('token123') };
  });

  test('успішний логін повертає токен та дані користувача', async () => {
    const existingUser = new User({ id: 1, email: 'u@test.com', name: 'Тест', passwordHash: 'hashed' });
    const userRepo = makeUserRepo({ findByEmail: jest.fn().mockResolvedValue(existingUser) });
    mockHasher.compare.mockResolvedValue(true);
    const useCase = new LoginUseCase(userRepo, mockHasher, mockToken);

    const result = await useCase.execute({ email: 'u@test.com', password: 'secret123' });

    expect(result.token).toBe('token123');
    expect(result.user.email).toBe('u@test.com');
  });

  test('кидає NotFoundError якщо користувач з таким email не існує', async () => {
    const userRepo = makeUserRepo({ findByEmail: jest.fn().mockResolvedValue(null) });
    const useCase = new LoginUseCase(userRepo, mockHasher, mockToken);

    await expect(
      useCase.execute({ email: 'nobody@test.com', password: 'secret123' })
    ).rejects.toThrow(NotFoundError);
  });

  test('кидає ValidationError якщо пароль невірний', async () => {
    const existingUser = new User({ id: 1, email: 'u@test.com', name: 'Тест', passwordHash: 'hashed' });
    const userRepo = makeUserRepo({ findByEmail: jest.fn().mockResolvedValue(existingUser) });
    mockHasher.compare.mockResolvedValue(false);
    const useCase = new LoginUseCase(userRepo, mockHasher, mockToken);

    await expect(
      useCase.execute({ email: 'u@test.com', password: 'wrongpassword' })
    ).rejects.toThrow(ValidationError);
  });

  test('кидає ValidationError при невалідному email', async () => {
    const useCase = new LoginUseCase(makeUserRepo(), mockHasher, mockToken);

    await expect(
      useCase.execute({ email: 'notanemail', password: 'secret123' })
    ).rejects.toThrow(ValidationError);
  });
});