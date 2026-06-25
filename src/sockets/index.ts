import { Server } from 'socket.io';
import { createServer } from 'http';

let io: Server;

export const initSocket = (server: ReturnType<typeof createServer>) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', socket => {
    socket.on('joinRoom', room => {
      socket.join(room);
    });

    socket.on('leaveRoom', room => {
      socket.leave(room);
    });

    socket.on('disconnect', () => {
      // silence
    });
  });
};

export const getSocket = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};
