import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().min(5),
  password: z.string().min(6)
});

export const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(5).optional(),
  password: z.string().min(6)
}).refine(data => Boolean(data.email || data.phone), {
  message: 'Email or phone is required'
});

export const createOrderSchema = z.object({
  restaurantId: z.number().int().positive(),
  customerId: z.number().int().positive().optional(),
  guestName: z.string().min(1).optional(),
  guestPhone: z.string().min(5).optional(),
  orderType: z.enum(['DELIVERY', 'SELF_PICKUP']),
  paymentMethod: z.enum(['CASH', 'CARD']),
  items: z.array(z.object({
    itemId: z.number().int().positive(),
    sizeId: z.number().int().positive().nullable().optional(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().nonnegative(),
    notes: z.string().optional()
  })).min(1),
  notes: z.string().optional(),
  deliveryAddress: z.string().optional()
});

export const createChatRoomSchema = z.object({
  orderId: z.number().int().positive(),
  type: z.enum(['CUSTOMER_RESTAURANT', 'CUSTOMER_DRIVER'])
});

export const createChatMessageSchema = z.object({
  roomId: z.number().int().positive(),
  senderUserId: z.number().int().positive().nullable().optional(),
  senderRole: z.enum(['CUSTOMER', 'STAFF', 'DRIVER', 'SYSTEM']),
  message: z.string().min(1)
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['NEW', 'RECEIVED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'FINISHED', 'CANCELLED']),
  actorType: z.enum(['CUSTOMER', 'STAFF', 'DRIVER', 'SYSTEM']).optional(),
  actorId: z.number().int().positive().nullable().optional(),
  comment: z.string().optional()
});
