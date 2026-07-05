import express from 'express';
import http from 'http';
import cors from 'cors';
import router from './routes';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config';
import { initSocket } from './sockets';
import { logger } from './utils/logger';
import { verifyDatabaseConnection } from './utils/startupCheck';

const app = express();
const server = http.createServer(app);

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

void verifyDatabaseConnection().then(connected => {
  if (!connected) {
    logger.warn('Server started without a verified database connection');
  }
});

server.listen(config.port, () => {
  logger.info(`Server listening on port ${config.port}`);
});
