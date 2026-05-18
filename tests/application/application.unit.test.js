const CreateOrderUseCase = require('../../application/orders/CreateOrderUseCase');
const UpdateOrderStatusUseCase = require('../../application/orders/UpdateOrderStatusUseCase');
const { DeleteOrderUseCase, GetUserOrdersUseCase } = require('../../application/orders/orders.usecases');
const { RegisterUseCase, LoginUseCase } = require('../../application/auth/auth.usecases');
const OrderFactory = require('../../domain/factories/OrderFactory');
const { Order } = require('../../domain/models/Order');
const User = require('../../domain/models/User');
const OrderItem = require('../../domain/value-objects/OrderItem');
const Money = require('../../domain/value-objects/Money');
const { NotFoundError, ConflictError, ValidationError } = require('../../domain/errors/DomainError');

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

describe('CreateOrderUseCase', () => {
  test('успішно створює замовлення', async () => {
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

  test('кидає NotFoundError якщо товар не знайдено', async () => {
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

describe('UpdateOrderStatusUseCase', () => {
  test('успішно оновлює статус', async () => {
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

  test('кидає ConflictError для скасованого замовлення', async () => {
    const order = makeValidOrder('cancelled');
    const orderRepo = makeOrderRepo({ findById: jest.fn().mockResolvedValue(order) });
    const useCase = new UpdateOrderStatusUseCase(orderRepo);

    await expect(
      useCase.execute({ orderId: 1, newStatus: 'confirmed', currentStatus: 'cancelled' })
    ).rejects.toThrow(ConflictError);
  });
});

describe('DeleteOrderUseCase', () => {
  test('успішно видаляє скасоване замовлення', async () => {
    const order = makeValidOrder('cancelled');
    const orderRepo = makeOrderRepo({ findById: jest.fn().mockResolvedValue(order) });
    const useCase = new DeleteOrderUseCase(orderRepo);

    await useCase.execute({ orderId: 1 });
    expect(orderRepo.delete).toHaveBeenCalledWith(1);
  });

  test('кидає ValidationError для не скасованого замовлення', async () => {
    const order = makeValidOrder('created');
    const orderRepo = makeOrderRepo({ findById: jest.fn().mockResolvedValue(order) });
    const useCase = new DeleteOrderUseCase(orderRepo);

    await expect(useCase.execute({ orderId: 1 })).rejects.toThrow(ValidationError);
    expect(orderRepo.delete).not.toHaveBeenCalled();
  });
});

describe('RegisterUseCase', () => {
  const mockHasher = { hash: jest.fn().mockResolvedValue('hashed'), compare: jest.fn() };
  const mockToken = { generate: jest.fn().mockReturnValue('token123') };

  beforeEach(() => jest.clearAllMocks());

  test('успішна реєстрація', async () => {
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

  test('кидає ValidationError при короткому паролі', async () => {
    const useCase = new RegisterUseCase(makeUserRepo(), mockHasher, mockToken);
    await expect(
      useCase.execute({ email: 'u@test.com', password: '123', name: 'Тест' })
    ).rejects.toThrow(ValidationError);
  });

  test('кидає ConflictError якщо email вже існує', async () => {
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
