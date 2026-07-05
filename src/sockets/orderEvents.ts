import { getSocket } from './index';

export const emitOrderUpdate = (orderId: string, payload: unknown) => {
  getSocket().to(`order:${orderId}`).emit('order:update', payload);
};

export const emitNotification = (room: string, payload: unknown) => {
  getSocket().to(room).emit('notification', payload);
};
