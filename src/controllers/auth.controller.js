const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const v = require('valibot');
const prisma = require('../prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

const RegisterSchema = v.object({
  email: v.pipe(v.string(), v.email('Invalid email format')),
  password: v.pipe(v.string(), v.minLength(6, 'Password must be at least 6 characters long')),
  name: v.pipe(v.string(), v.minLength(1, 'Name cannot be empty'))
});

const LoginSchema = v.object({
  email: v.pipe(v.string(), v.email('Invalid email format')),
  password: v.pipe(v.string(), v.minLength(1, 'Password is required'))
});

exports.register = async (req, res) => {
  const result = v.safeParse(RegisterSchema, req.body);

  if (!result.success) {
    const message = result.issues[0].message;
    return res.status(400).json({ message });
  }

  const { email, password, name } = result.output;

  try {
    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.users.create({
      data: { email, password: hashedPassword, name }
    });

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { user_id: user.user_id, email: user.email, name: user.name }
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

exports.login = async (req, res) => {
  const result = v.safeParse(LoginSchema, req.body);

  if (!result.success) {
    return res.status(400).json({ message: result.issues[0].message });
  }

  const { email, password } = result.output;

  try {
    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { user_id: user.user_id, email: user.email, name: user.name }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};