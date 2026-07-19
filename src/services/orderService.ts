import { prisma } from '../database/prisma';
import { emitOrderUpdate, emitNotification } from '../sockets/orderEvents';
import { logger } from '../utils/logger';

const ORDER_STATUSES = ['NEW', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'IN_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY', 'CANCELLED'] as const;

export const createOrder = async (payload: any) => {
  const { branchId, customerId, guestName, guestPhone, orderType, items, notes, street, buildingNumber, apartmentNumber, floor, city, postalCode, latitude, longitude, accessNotes } = payload;

  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    include: { deliveryRules: true }
  });

  if (!branch) {
    throw new Error('Branch not found');
  }

  const subtotal = items.reduce((sum: number, item: any) => {
    const basePrice = Number(item.unitPrice || 0);
    const modifierTotal = (item.modifiers || []).reduce((modifierSum: number, modifier: any) => {
      return modifierSum + Number(modifier.price ?? modifier.modifierOptionPrice ?? 0);
    }, 0);
    return sum + (basePrice + modifierTotal) * item.quantity;
  }, 0);
  const deliveryFee = orderType === 'DELIVERY' ? Number(branch.deliveryRules?.baseDeliveryFee ?? 0) : null;
  const total = orderType === 'DELIVERY' ? subtotal + (deliveryFee || 0) : subtotal;

  const order = await prisma.order.create({
    data: {
      customerId,
      branchId,
      orderType,
      status: 'NEW',
      totalPrice: total,
      deliveryFee,
      customerName: guestName || '',
      customerPhone: guestPhone,
      street,
      buildingNumber,
      apartmentNumber,
      floor,
      city,
      postalCode,
      latitude,
      longitude,
      accessNotes,
      items: {
        create: items.map((item: any) => ({
          itemName: item.itemName || item.name || 'Item',
          sizeName: item.sizeName || item.size || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes,
          modifiers: {
            create: (item.modifiers || []).map((modifier: any) => ({
              modifierGroupNameSnapshot: modifier.modifierGroupName || modifier.groupName || 'Modifier',
              modifierOptionNameSnapshot: modifier.modifierOptionName || modifier.name || 'Option',
              priceSnapshot: Number(modifier.price ?? modifier.modifierOptionPrice ?? 0),
              ...(modifier.modifierOptionId ? { modifierOptionId: modifier.modifierOptionId } : {})
            }))
          }
        }))
      },
      statusHistory: {
        create: {
          status: 'NEW',
          changedByRole: 'SYSTEM',
          reason: 'Order created'
        }
      }
    },
    include: { items: { include: { modifiers: true } }, statusHistory: true }
  });

  emitOrderUpdate(order.id, { event: 'order.created', orderId: order.id, status: 'NEW', total });
  emitNotification(`branch:${branchId}`, { event: 'order.created', orderId: order.id });
  logger.info('Order created', { orderId: order.id, branchId });

  return { id: order.id, status: 'NEW', total };
};

export const getOrderById = async (id: string) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      statusHistory: true,
      customer: true,
      branch: true,
      driverAssignment: true,
      chat: true
    }
  });

  if (!order) {
    throw new Error('Order not found');
  }

  return order;
};

export const getOrdersForCustomer = async ({ customerId, phone }: { customerId?: string; phone?: string }) => {
  return prisma.order.findMany({
    where: {
      OR: [
        customerId ? { customerId } : undefined,
        phone ? { customerPhone: phone } : undefined
      ].filter(Boolean) as any
    },
    include: { items: true, statusHistory: true },
    orderBy: { createdAt: 'desc' }
  });
};

export const updateOrderStatus = async (id: string, status: string, changedByUserId?: string, changedByRole: string = 'SYSTEM', reason?: string) => {
  if (!ORDER_STATUSES.includes(status as typeof ORDER_STATUSES[number])) {
    throw new Error('Invalid status');
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      status,
      statusHistory: {
        create: {
          status,
          changedByUserId,
          changedByRole,
          reason
        }
      }
    },
    include: { items: true, statusHistory: true }
  });

  emitOrderUpdate(id, { event: 'order.status.changed', orderId: id, status });
  emitNotification(`order:${id}`, { event: 'order.status.changed', orderId: id, status });
  logger.info('Order status updated', { orderId: id, status, changedByRole });

  return order;
};

export const listRestaurantOrders = async (branchId: string, filter?: { status?: string }) => {
  return prisma.order.findMany({
    where: {
      branchId,
      status: filter?.status
    },
    include: { items: true, customer: true, statusHistory: true },
    orderBy: { createdAt: 'desc' }
  });
};

export const listDriverOrders = async (driverId: string) => {
  return prisma.order.findMany({
    where: {
      driverAssignment: {
        driverId
      }
    },
    include: { items: true, customer: true, statusHistory: true, driverAssignment: true },
    orderBy: { createdAt: 'desc' }
  });
};

export const assignDriver = async (orderId: string, driverId: string) => {
  return prisma.driverAssignment.create({
    data: {
      orderId,
      driverId
    }
  });
};

export const cancelOrder = async (id: string, reason?: string) => {
  return updateOrderStatus(id, 'CANCELLED', undefined, 'SYSTEM', reason || 'Order cancelled by customer');
};
