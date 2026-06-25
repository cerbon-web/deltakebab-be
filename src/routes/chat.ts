import { Router } from 'express';
import { createChatRoomController, getChatMessagesController, createChatMessageController } from '../controllers/chatController';
import { validate } from '../middleware/validate';
import { createChatRoomSchema, createChatMessageSchema } from '../validators/schemas';

const router = Router();

router.post('/room', validate(createChatRoomSchema), createChatRoomController);
router.get('/:roomId', getChatMessagesController);
router.post('/message', validate(createChatMessageSchema), createChatMessageController);

export default router;
