import { prisma } from '../database/prisma';
import { logger } from '../utils/logger';

const modelOrder = [
  'notification',
  'message',
  'chat',
  'driverAssignment',
  'orderEvent',
  'orderStatusHistory',
  'orderItem',
  'payment',
  'order',
  'customerAddress',
  'restaurantItemOverride',
  'itemPrice',
  'item',
  'category',
  'size',
  'restaurantHours',
  'restaurantDeliveryRules',
  'restaurantInfo',
  'restaurantStaff',
  'branch',
  'restaurant',
  'userRole',
  'role',
  'user',
  'driverProfile'
];

export const resetDatabase = async (confirmation: string) => {
  if (confirmation !== 'DELETE') {
    throw new Error('Confirmation required');
  }

  for (const model of modelOrder) {
    // @ts-ignore
    await prisma[model].deleteMany();
  }

  logger.warn('Database reset executed', { modelOrder });
  return { message: 'Database reset complete', models: modelOrder };
};

export const exportDatabase = async () => {
  const payload: Record<string, unknown[]> = {};

  for (const model of modelOrder) {
    // @ts-ignore
    payload[model] = await prisma[model].findMany();
  }

  return { payload, models: modelOrder };
};

export const importDatabase = async (payload: Record<string, unknown[]>, clearExisting = false) => {
  if (clearExisting) {
    for (const model of modelOrder) {
      // @ts-ignore
      await prisma[model].deleteMany();
    }
  }

  for (const model of modelOrder) {
    const rows = payload[model] as Record<string, unknown>[] | undefined;
    if (!rows?.length) {
      continue;
    }

    for (const row of rows) {
      // @ts-ignore
      await prisma[model].create({ data: row });
    }
  }

  logger.info('Database import executed', { models: modelOrder, clearExisting });
  return { message: 'Database import complete', models: modelOrder };
};
