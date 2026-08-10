import express from 'express';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import cors from 'cors';
import router from './routes';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config';
import { initSocket } from './sockets';
import { logger } from './utils/logger';
import { verifyDatabaseConnection } from './utils/startupCheck';

const app = express();
let server: http.Server | https.Server;

logger.info(`Starting backend in environment=${config.environment}; useHttps=${config.useHttps}`);
logger.info(`SSL paths: key=${config.sslKeyPath} cert=${config.sslCertPath} ca=${config.sslCaPath} filesExist=${config.sslFilesExist}`);
if (config.useHttps && !config.sslFilesExist) {
  logger.warn('Production HTTPS is enabled but SSL files are missing or unreadable. Startup will still attempt HTTPS and fail if files cannot be loaded.');
}

if (config.useHttps) {
  try {
    const key = fs.readFileSync(config.sslKeyPath!, 'utf8');
    const cert = fs.readFileSync(config.sslCertPath!, 'utf8');
    const ca = config.sslCaPath ? fs.readFileSync(config.sslCaPath, 'utf8') : undefined;

    server = https.createServer(
      {
        key,
        cert,
        ca
      },
      app
    );
    logger.info(`Starting HTTPS server using key=${config.sslKeyPath} cert=${config.sslCertPath}`);
  } catch (error) {
    logger.error('Failed to initialize HTTPS server; aborting startup', error);
    process.exit(1);
  }
} else {
  server = http.createServer(app);
}

const allowedOrigins = ['https://deltakebab.com', 'https://www.deltakebab.com', 'http://localhost:4200'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
const appRoot = path.resolve(__dirname, '..');
app.use('/uploads', express.static(path.resolve(appRoot, 'uploads')));
app.use('/api', router);
app.use(errorHandler);

initSocket(server);

const isDatabaseEmpty = () => {
  const nodeCommand = process.execPath;
  const result = spawnSync(nodeCommand, [path.resolve(__dirname, '..', 'scripts', 'check-db-empty.js')], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status === 0) {
    return true;
  }

  if (result.status === 1) {
    return false;
  }

  logger.warn('Unable to verify database state; skipping Prisma prepare/seed.');
  return false;
};

const runPrismaPrepareAndSeedIfEmpty = () => {
  if (process.env.SKIP_PRISMA_SEED) {
    logger.info('SKIP_PRISMA_SEED set; skipping Prisma prepare/seed.');
    return;
  }

  if (!isDatabaseEmpty()) {
    logger.info('Database already has tables or could not be verified; skipping Prisma prepare/seed.');
    return;
  }

  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  logger.info(`Running Prisma prepare with NODE_OPTIONS=${process.env.NODE_OPTIONS || '<unset>'}`);
  const prepareResult = spawnSync(npmCommand, ['run', 'db:prepare'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    env: process.env,
  });

  if (prepareResult.error) {
    logger.warn('Prisma prepare step failed to start; skipping seed and continuing startup', prepareResult.error);
    return;
  }
  if (prepareResult.signal) {
    logger.warn(`Prisma prepare step was terminated by signal ${prepareResult.signal}; skipping seed and continuing startup`);
    return;
  }
  if (prepareResult.status !== 0) {
    logger.warn(`Prisma prepare step exited with code ${prepareResult.status}; skipping seed and continuing startup`);
    return;
  }

  const seedResult = spawnSync(npmCommand, ['run', 'db:seed'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    env: process.env,
  });

  if (seedResult.status !== 0) {
    logger.warn('Database seed step finished with a non-zero exit code; continuing startup');
  }
};

void verifyDatabaseConnection().then(connected => {
  if (!connected) {
    logger.warn('Server started without a verified database connection');
  }
});

runPrismaPrepareAndSeedIfEmpty();

server.listen(config.port, () => {
  logger.info(`Server listening on port ${config.port}`);
});
