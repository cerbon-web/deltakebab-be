import { db } from '../database/knex';

export const createChatRoom = async (payload: any) => {
  const [id] = await db('chat_rooms').insert({
    order_id: payload.orderId,
    type: payload.type,
    created_at: db.fn.now()
  });
  return { id: Number(id), orderId: payload.orderId, type: payload.type };
};

export const getChatMessages = async (roomId: number) => {
  return db('chat_messages').where('room_id', roomId).orderBy('created_at', 'asc');
};

export const createChatMessage = async (payload: any) => {
  const [id] = await db('chat_messages').insert({
    room_id: payload.roomId,
    sender_user_id: payload.senderUserId ?? null,
    sender_role: payload.senderRole,
    message: payload.message,
    created_at: db.fn.now()
  });
  return { id: Number(id), ...payload };
};
