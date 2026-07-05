import { prisma } from '../database/prisma';

export const createChatRoom = async (payload: any) => {
  return prisma.chat.create({
    data: {
      order: { connect: { id: payload.orderId } }
    }
  });
};

export const getChatMessages = async (roomId: string) => {
  return prisma.message.findMany({
    where: { chatId: roomId },
    orderBy: { createdAt: 'asc' }
  });
};

export const createChatMessage = async (payload: any) => {
  return prisma.message.create({
    data: {
      chat: { connect: { id: payload.roomId } },
      user: { connect: { id: payload.senderUserId } },
      content: payload.message
    }
  });
};
