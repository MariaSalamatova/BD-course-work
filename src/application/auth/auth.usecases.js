const User = require('../../domain/models/user.model');
const Email = require('../../domain/value-objects/email.vo');
const { ValidationError, ConflictError, NotFoundError } = require('../../domain/errors/domain.errors');

class RegisterUseCase {
  /**
   * @param {IUserRepository} userRepository
   * @param {IPasswordHasher} passwordHasher
   * @param {ITokenService} tokenService
   */
  constructor(userRepository, passwordHasher, tokenService) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
  }

  async execute({ email, password, name }) {
    const emailVO = new Email(email);

    if (!password || password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long');
    }

    const existing = await this.userRepository.findByEmail(emailVO.getValue());
    if (existing) {
      throw new ConflictError('Email already in use');
    }

    const passwordHash = await this.passwordHasher.hash(password);

    const user = new User({ email: emailVO, name, passwordHash });
    const savedUser = await this.userRepository.save(user);

    const token = this.tokenService.generate({
      userId: savedUser.getId(),
      email: savedUser.getEmail().getValue()
    });

    return { token, user: savedUser.toPlain() };
  }
}

class LoginUseCase {
  constructor(userRepository, passwordHasher, tokenService) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
  }

  async execute({ email, password }) {
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    const emailVO = new Email(email);
    const user = await this.userRepository.findByEmail(emailVO.getValue());

    if (!user) {
      throw new NotFoundError('Invalid email or password');
    }

    const isValid = await this.passwordHasher.compare(password, user.getPasswordHash());
    if (!isValid) {
      throw new NotFoundError('Invalid email or password');
    }

    const token = this.tokenService.generate({
      userId: user.getId(),
      email: user.getEmail().getValue()
    });

    return { token, user: user.toPlain() };
  }
}

module.exports = { RegisterUseCase, LoginUseCase };
