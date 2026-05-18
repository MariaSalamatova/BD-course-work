const User = require('../../domain/models/User');
const Email = require('../../domain/value-objects/Email');

class UserMapper {
  static toDomain(prismaUser) {
    return new User({
      id: prismaUser.user_id,
      email: new Email(prismaUser.email),
      name: prismaUser.name,
      passwordHash: prismaUser.password
    });
  }

  static toResponse(user) {
    return {
      user_id: user.getId(),
      email: user.getEmail().getValue(),
      name: user.getName()
    };
  }
}

module.exports = UserMapper;
