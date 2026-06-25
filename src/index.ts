import express from 'express';
import http from 'http';
import cors from 'cors';
import router from './routes';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config';
import { initSocket } from './sockets';

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use('/api', router);
app.use(errorHandler);

initSocket(server);

server.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});
