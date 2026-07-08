const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

const rootDir = path.resolve(__dirname, '..');
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
const envPath = path.resolve(rootDir, envFile);
dotenv.config({ path: envPath, override: false });

if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
  const port = process.env.DB_PORT || '3306';
  process.env.DATABASE_URL = `mysql://${encodeURIComponent(process.env.DB_USER)}:${encodeURIComponent(process.env.DB_PASSWORD || '')}@${process.env.DB_HOST}:${port}/${encodeURIComponent(process.env.DB_NAME)}`;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Cannot check database state.');
    process.exit(2);
  }

  const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
  try {
    const result = await prisma.$queryRaw`SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = DATABASE();`;
    const count = Number(result?.[0]?.count ?? result?.[0]?.COUNT ?? 0);

    if (count === 0) {
      console.log('Database exists and no tables were found.');
      process.exit(0);
    }

    console.log('Database already contains tables.');
    process.exit(1);
  } catch (error) {
    console.error('Failed to check database schema:', error);
    process.exit(2);
  } finally {
    await prisma.$disconnect();
  }
}

main();
