const { ValidationError, ConflictError, NotFoundError } = require('../../domain/errors/DomainError');

function domainErrorToStatus(error) {
  if (error instanceof ValidationError) return 400;
  if (error instanceof ConflictError) return 409;
  if (error instanceof NotFoundError) return 401;
  return 500;
}

class AuthController {
  constructor({ registerUseCase, loginUseCase }) {
    this.registerUseCase = registerUseCase;
    this.loginUseCase = loginUseCase;
  }

  async register(req, res) {
    try {
      const result = await this.registerUseCase.execute(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(domainErrorToStatus(error)).json({ message: error.message });
    }
  }

  async login(req, res) {
    try {
      const result = await this.loginUseCase.execute(req.body);
      res.json(result);
    } catch (error) {
      res.status(domainErrorToStatus(error)).json({ message: error.message });
    }
  }
}

module.exports = AuthController;
