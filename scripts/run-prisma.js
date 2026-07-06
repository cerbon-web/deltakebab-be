const path = require('path');
const { spawnSync } = require('child_process');
const dotenv = require('dotenv');

const rootDir = path.resolve(__dirname, '..');
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
const envPath = path.resolve(rootDir, envFile);
const result = dotenv.config({ path: envPath, override: false });

if (result.error) {
  console.warn(`⚠️ Could not load ${envFile}: ${result.error.message}`);
}

const env = {
  ...(result.parsed || {}),
  ...process.env,
};

if (!env.DATABASE_URL && env.DB_HOST && env.DB_USER && env.DB_NAME) {
  const port = env.DB_PORT || '3306';
  env.DATABASE_URL = `mysql://${encodeURIComponent(env.DB_USER)}:${encodeURIComponent(env.DB_PASSWORD || '')}@${env.DB_HOST}:${port}/${encodeURIComponent(env.DB_NAME)}`;
}

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const args = ['prisma', ...process.argv.slice(2)];

const child = spawnSync(command, args, {
  cwd: rootDir,
  stdio: 'inherit',
  env,
});

if (typeof child.status === 'number') {
  process.exit(child.status);
}

process.exit(1);
