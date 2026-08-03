import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../database/prisma';
import { config } from '../config';

const signOptions = {
  expiresIn: config.jwtExpiresIn
} as unknown as jwt.SignOptions;

export const registerUser = async ({ name, email, phone, password }: { name: string; email?: string; phone: string; password: string }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.create({
    data: {
      name,
      email: email ?? `user-${Date.now()}@local`,
      phone,
      passwordHash,
      authProvider: 'NATIVE',
      roles: {
        create: {
          role: {
            connectOrCreate: {
              where: { name: 'CUSTOMER' },
              create: { name: 'CUSTOMER' }
            }
          }
        }
      }
    },
    include: { roles: { include: { role: true } } }
  });

  const roleNames = user.roles.map(r => r.role.name);
  const token = jwt.sign({ id: user.id, roles: roleNames }, config.jwtSecret as jwt.Secret, signOptions);

  return { 
    token, 
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      phone: user.phone, 
      roles: roleNames,
      branchIds: []
    } 
  };
};

export const loginUser = async ({ email, phone, password }: { email?: string; phone?: string; password: string }) => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        email ? { email } : undefined,
        phone ? { phone } : undefined
      ].filter(Boolean) as any
    },
    include: { roles: { include: { role: true } }, restaurantStaff: true }
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  if (user.isBlocked) {
    throw new Error('User account is blocked');
  }

  const isValid = user.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  const roleNames = user.roles.map(r => r.role.name);
  const branchIds = (user.restaurantStaff || []).map(staff => staff.branchId);
  const token = jwt.sign({ id: user.id, roles: roleNames, branchIds }, config.jwtSecret as jwt.Secret, signOptions);

  return { 
    token, 
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      phone: user.phone, 
      roles: roleNames,
      branchIds
    } 
  };
};

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const roleNames = user.roles.map(r => r.role.name);

  return { 
    id: user.id, 
    name: user.name, 
    email: user.email, 
    phone: user.phone, 
    roles: roleNames,
    isBlocked: user.isBlocked
  };
};
