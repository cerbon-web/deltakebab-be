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
    logger.info('Starting HTTPS server');
  } catch (error) {
    logger.error('Failed to initialize HTTPS server, falling back to HTTP', error);
    server = http.createServer(app);
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
app.use('/api', router);
app.use(errorHandler);

initSocket(server);

const runSeedIfNeeded = () => {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npmCommand, ['run', 'db:seed'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    env: process.env
  });

  if (result.status !== 0) {
    logger.warn('Database seed step finished with a non-zero exit code; continuing startup');
  }
};

void verifyDatabaseConnection().then(connected => {
  if (!connected) {
    logger.warn('Server started without a verified database connection');
  }
});

runSeedIfNeeded();

server.listen(config.port, () => {
  logger.info(`Server listening on port ${config.port}`);
});
