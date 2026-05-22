const User = require('../../../domain/models/User');
const Email = require('../../../domain/value-objects/Email');
const { ValidationError, ConflictError, NotFoundError } = require('../../../domain/errors/DomainError');


class RegisterHandler {
  /**
   * @param {import('../../../domain/repositories').IUserRepository} userRepository
   * @param {object} passwordHasher
   * @param {object} tokenService
   */
  constructor(userRepository, passwordHasher, tokenService) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
  }

  /**
   * @param {import('./AuthCommands').RegisterCommand} command
   * @returns {Promise<{token: string, user: object}>}
   */
  async handle(command) {
    const emailVO = new Email(command.email);

    if (!command.password || command.password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long');
    }

    const existing = await this.userRepository.findByEmail(emailVO.getValue());
    if (existing) {
      throw new ConflictError('Email already in use');
    }

    const passwordHash = await this.passwordHasher.hash(command.password);
    const user = new User({ email: emailVO, name: command.name, passwordHash });
    const savedUser = await this.userRepository.save(user);

    const token = this.tokenService.generate({
      userId: savedUser.getId(),
      email: savedUser.getEmail().getValue(),
    });

    return { token, user: savedUser.toPlain() };
  }
}

class LoginHandler {
  constructor(userRepository, passwordHasher, tokenService) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
  }

  /**
   * @param {import('./AuthCommands').LoginCommand} command
   * @returns {Promise<{token: string, user: object}>}
   */
  async handle(command) {
    if (!command.email || !command.password) {
      throw new ValidationError('Email and password are required');
    }

    const emailVO = new Email(command.email);
    const user = await this.userRepository.findByEmail(emailVO.getValue());

    if (!user) {
      throw new NotFoundError('Invalid email or password');
    }

    const isValid = await this.passwordHasher.compare(command.password, user.getPasswordHash());
    if (!isValid) {
      throw new NotFoundError('Invalid email or password');
    }

    const token = this.tokenService.generate({
      userId: user.getId(),
      email: user.getEmail().getValue(),
    });

    return { token, user: user.toPlain() };
  }
}

module.exports = { RegisterHandler, LoginHandler };
