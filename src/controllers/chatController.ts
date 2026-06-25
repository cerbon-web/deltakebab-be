import { Request, Response } from 'express';
import { createChatRoom, getChatMessages, createChatMessage } from '../services/chatService';

export const createChatRoomController = async (req: Request, res: Response) => {
  const room = await createChatRoom(req.body);
  res.status(201).json(room);
};

export const getChatMessagesController = async (req: Request, res: Response) => {
  const messages = await getChatMessages(Number(req.params.roomId));
  res.json(messages);
};

export const createChatMessageController = async (req: Request, res: Response) => {
  const message = await createChatMessage(req.body);
  res.status(201).json(message);
};
