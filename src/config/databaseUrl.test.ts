import assert from 'node:assert/strict';
import { buildDatabaseUrlFromEnv } from './databaseUrl';

const dbUrlFromEnv = buildDatabaseUrlFromEnv({
  DB_HOST: '127.0.0.1',
  DB_PORT: '3306',
  DB_USER: 'root',
  DB_PASSWORD: 'root',
  DB_NAME: 'delta_kebab_db',
  DATABASE_URL: 'mysql://delta_user:StrongPassword123@localhost:3306/delta_kebab',
});

assert.equal(dbUrlFromEnv, 'mysql://root:root@127.0.0.1:3306/delta_kebab_db');

const dbUrlFallback = buildDatabaseUrlFromEnv({
  DATABASE_URL: 'mysql://delta:delta@db:3306/delta_kebab_db',
});

assert.equal(dbUrlFallback, 'mysql://delta:delta@db:3306/delta_kebab_db');

console.log('database URL resolution tests passed');
