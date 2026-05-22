const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

class BcryptPasswordHasher {
  async hash(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async compare(password, hash) {
    return bcrypt.compare(password, hash);
  }
}

class JwtTokenService {
  generate(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  }

  verify(token) {
    return jwt.verify(token, JWT_SECRET);
  }
}

module.exports = { BcryptPasswordHasher, JwtTokenService };
