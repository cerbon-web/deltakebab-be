import { db } from '../database/knex';
import { logger } from './logger';

export const verifyDatabaseConnection = async () => {
  try {
    await db.raw('SELECT 1');
    logger.info('Database connection verified');
    return true;
  } catch (error) {
    logger.error('Database connection failed', { error });
    return false;
  }
};
