import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { db } from '../database/knex';
import { config } from '../config';

const signOptions = {
  expiresIn: config.jwtExpiresIn
} as unknown as jwt.SignOptions;

export const registerUser = async ({ name, email, phone, password }: { name: string; email?: string; phone: string; password: string }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const [userId] = await db('users').insert({
    name,
    email: email ?? null,
    phone,
    password_hash: passwordHash,
    role: 'CUSTOMER',
    created_at: db.fn.now(),
    updated_at: db.fn.now()
  });

  const token = jwt.sign({ id: Number(userId), role: 'CUSTOMER' }, config.jwtSecret as jwt.Secret, signOptions);

  return { token, user: { id: Number(userId), name, email, phone, role: 'CUSTOMER' } };
};

export const loginUser = async ({ email, phone, password }: { email?: string; phone?: string; password: string }) => {
  const user = await db('users')
    .where(function () {
      if (email) this.where('email', email);
      if (phone) this.orWhere('phone', phone);
    })
    .first();

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret as jwt.Secret, signOptions);

  return { token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } };
};
