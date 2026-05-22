const { RegisterCommand, LoginCommand } = require('../../application/commands/auth/AuthCommands');
const { DomainError, ValidationError, NotFoundError, ConflictError } = require('../../domain/errors/DomainError');

class AuthController {
  /**
   * @param {object} handlers
   * @param {import('../../application/commands/auth/AuthHandlers').RegisterHandler} handlers.registerHandler
   * @param {import('../../application/commands/auth/AuthHandlers').LoginHandler} handlers.loginHandler
   */
  constructor({ registerHandler, loginHandler }) {
    this.registerHandler = registerHandler;
    this.loginHandler = loginHandler;
  }

  // POST /auth/register
  async register(req, res) {
    try {
      // Маппінг HTTP → Command
      const command = new RegisterCommand({
        email: req.body.email,
        password: req.body.password,
        name: req.body.name,
      });

      const result = await this.registerHandler.handle(command);
      res.status(201).json(result);
    } catch (err) {
      this._handleError(err, res);
    }
  }

  async login(req, res) {
    try {
      const command = new LoginCommand({
        email: req.body.email,
        password: req.body.password,
      });

      const result = await this.loginHandler.handle(command);
      res.json(result);
    } catch (err) {
      this._handleError(err, res);
    }
  }

  _handleError(err, res) {
    if (err instanceof ValidationError) return res.status(400).json({ message: err.message });
    if (err instanceof NotFoundError)   return res.status(401).json({ message: err.message });
    if (err instanceof ConflictError)   return res.status(409).json({ message: err.message });
    if (err instanceof DomainError)     return res.status(422).json({ message: err.message });
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = AuthController;
