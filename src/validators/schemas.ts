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
  branchId: z.string().min(1),
  restaurantId: z.string().min(1).optional(),
  customerId: z.string().min(1).optional(),
  guestName: z.string().min(1).optional(),
  guestPhone: z.string().min(5),
  orderType: z.enum(['DELIVERY', 'SELF_PICKUP']),
  paymentMethod: z.enum(['CASH', 'CARD']),
  items: z.array(z.object({
    itemId: z.string().min(1),
    itemName: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    sizeId: z.string().min(1).nullable().optional(),
    sizeName: z.string().min(1).optional(),
    size: z.string().min(1).optional(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().nonnegative(),
    notes: z.string().optional()
  })).min(1),
  notes: z.string().optional(),
  deliveryAddress: z.string().optional()
});

export const createChatRoomSchema = z.object({
  orderId: z.string().min(1)
});

export const createChatMessageSchema = z.object({
  roomId: z.string().min(1),
  senderUserId: z.string().min(1),
  message: z.string().min(1)
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['NEW', 'RECEIVED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'IN_DELIVERY', 'DELIVERED', 'FINISHED', 'FAILED_DELIVERY', 'CANCELLED']),
  actorType: z.enum(['CUSTOMER', 'STAFF', 'DRIVER', 'SYSTEM']).optional(),
  actorId: z.string().min(1).nullable().optional(),
  comment: z.string().optional()
});
