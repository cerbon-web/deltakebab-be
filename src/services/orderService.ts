import { db } from '../database/knex';
import { emitOrderUpdate, emitNotification } from '../sockets/orderEvents';
import { logger } from '../utils/logger';

const ORDER_STATUSES = ['NEW', 'RECEIVED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'FINISHED', 'CANCELLED'] as const;

export const createOrder = async (payload: any) => {
  const { restaurantId, customerId, guestName, guestPhone, orderType, paymentMethod, items, notes, deliveryAddress } = payload;

  const subtotal = items.reduce((sum: number, item: any) => sum + Number(item.unitPrice) * item.quantity, 0);
  const total = subtotal;

  const [orderId] = await db('orders').insert({
    restaurant_id: restaurantId,
    customer_id: customerId ?? null,
    guest_name: guestName ?? null,
    guest_phone: guestPhone ?? null,
    order_type: orderType,
    payment_method: paymentMethod,
    payment_status: 'PENDING',
    status: 'NEW',
    delivery_address: deliveryAddress ?? null,
    subtotal,
    total,
    notes: notes ?? null,
    created_at: db.fn.now(),
    updated_at: db.fn.now()
  });

  const orderItems = items.map((item: any) => ({
    order_id: Number(orderId),
    item_id: item.itemId,
    size_id: item.sizeId ?? null,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    line_total: Number(item.unitPrice) * item.quantity,
    notes: item.notes ?? null
  }));

  await db('order_items').insert(orderItems);
  await db('order_status_history').insert({
    order_id: Number(orderId),
    status: 'NEW',
    actor_type: 'SYSTEM',
    actor_id: null,
    comment: 'Order created'
  });

  emitOrderUpdate(Number(orderId), { event: 'order.created', orderId: Number(orderId), status: 'NEW', total });
  emitNotification(`restaurant:${restaurantId}`, { event: 'order.created', orderId: Number(orderId) });
  logger.info('Order created', { orderId: Number(orderId), restaurantId });

  return { id: Number(orderId), status: 'NEW', total };
};

export const getOrderById = async (id: number) => {
  const order = await db('orders').where('id', id).first();
  const items = await db('order_items').where('order_id', id).select('*');
  return { ...order, items };
};

export const getOrdersForCustomer = async ({ customerId, phone }: { customerId?: number; phone?: string }) => {
  const query = db('orders').select('*').orderBy('created_at', 'desc');
  if (customerId) query.where('customer_id', customerId);
  if (phone) query.where('guest_phone', phone);
  return query;
};

export const updateOrderStatus = async (id: number, status: string, actorType = 'SYSTEM', actorId: number | null = null, comment?: string) => {
  if (!ORDER_STATUSES.includes(status as typeof ORDER_STATUSES[number])) {
    throw new Error('Invalid status');
  }
  await db('orders').where('id', id).update({ status, updated_at: db.fn.now() });
  await db('order_status_history').insert({
    order_id: id,
    status,
    actor_type: actorType,
    actor_id: actorId,
    comment: comment ?? null
  });

  emitOrderUpdate(id, { event: 'order.status.changed', orderId: id, status });
  emitNotification(`order:${id}`, { event: 'order.status.changed', orderId: id, status });
  logger.info('Order status updated', { orderId: id, status, actorType });

  return { id, status };
};

export const listRestaurantOrders = async (restaurantId: number) => {
  return db('orders').where('restaurant_id', restaurantId).orderBy('created_at', 'desc');
};

export const listDriverOrders = async (driverId: number) => {
  return db('driver_assignments').where('driver_id', driverId).join('orders', 'orders.id', 'driver_assignments.order_id').select('orders.*');
};
