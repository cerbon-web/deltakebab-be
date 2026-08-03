import { prisma } from '../database/prisma';
import { ApiError } from '../middleware/errorHandler';
import { emitOrderUpdate, emitNotification } from '../sockets/orderEvents';
import { logger } from '../utils/logger';

const ORDER_STATUSES = ['NEW', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'IN_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY', 'CANCELLED'] as const;

const toNumber = (value: unknown) => (value == null ? null : Number(value));

const serializeOrderItem = (item: any) => ({
  id: item.id,
  orderId: item.orderId,
  itemName: item.itemName,
  sizeName: item.sizeName,
  quantity: item.quantity,
  unitPrice: toNumber(item.unitPrice),
  notes: item.notes,
  createdAt: item.createdAt,
  modifiers: (item.modifiers || []).map((modifier: any) => ({
    id: modifier.id,
    modifierGroupNameSnapshot: modifier.modifierGroupNameSnapshot,
    modifierOptionNameSnapshot: modifier.modifierOptionNameSnapshot,
    priceSnapshot: toNumber(modifier.priceSnapshot)
  }))
});

const serializeOrder = (order: any) => ({
  ...order,
  paymentMethod: order.payment?.method ?? order.paymentMethod ?? null,
  totalPrice: toNumber(order.totalPrice),
  deliveryFee: order.deliveryFee == null ? null : toNumber(order.deliveryFee),
  items: (order.items || []).map(serializeOrderItem)
});

export const createOrder = async (payload: any) => {
  const { branchId, customerId, guestName, guestPhone, orderType, paymentMethod, items, notes, street, buildingNumber, apartmentNumber, floor, city, postalCode, latitude, longitude, accessNotes } = payload;

  if (!branchId) {
    throw new ApiError(400, 'BRANCH_REQUIRED', 'Branch is required', [{ field: 'branchId', code: 'BRANCH_REQUIRED' }]);
  }

  if (!items?.length) {
    throw new ApiError(400, 'ORDER_ITEMS_REQUIRED', 'At least one order item is required', [{ field: 'items', code: 'ORDER_ITEMS_REQUIRED' }]);
  }

  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    include: { deliveryRules: true }
  });

  if (!branch) {
    throw new ApiError(404, 'BRANCH_NOT_FOUND', 'Branch not found', [{ field: 'branchId', code: 'BRANCH_NOT_FOUND' }]);
  }

  const effectiveCustomerId = customerId || await (async () => {
    const guestEmail = `guest-${Date.now()}-${Math.random().toString(36).slice(2)}@local.invalid`;
    const guestUser = await prisma.user.create({
      data: {
        name: guestName || guestPhone || 'Guest customer',
        email: guestEmail,
        phone: guestPhone,
        authProvider: 'NATIVE'
      }
    });
    return guestUser.id;
  })();

  const normalizedPaymentMethod = String(paymentMethod || 'CASH').toUpperCase();
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
      customer: {
        connect: { id: effectiveCustomerId }
      },
      branch: {
        connect: { id: branchId }
      },
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
    include: { items: { include: { modifiers: true } }, statusHistory: true, payment: true }
  });

  await prisma.payment.create({
    data: {
      orderId: order.id,
      method: normalizedPaymentMethod,
      status: 'PENDING',
      amount: total
    }
  }).catch(() => undefined);

  emitOrderUpdate(order.id, { event: 'order.created', orderId: order.id, status: 'NEW', total });
  emitNotification(`branch:${branchId}`, { event: 'order.created', orderId: order.id });
  logger.info('Order created', { orderId: order.id, branchId });

  return {
    id: order.id,
    orderNumber: order.id.toUpperCase().slice(0, 8),
    status: 'NEW',
    totalPrice: Number(total),
    deliveryFee: deliveryFee ? Number(deliveryFee) : null,
    createdAt: order.createdAt,
    orderType,
    customerName: guestName || '',
    customerPhone: guestPhone,
    branch: {
      id: branch.id,
      name: branch.name,
      street: branch.street,
      buildingNumber: branch.buildingNumber,
      city: branch.city
    },
    paymentMethod: normalizedPaymentMethod,
    items: order.items.map((item: any) => ({
      id: item.id,
      itemName: item.itemName,
      sizeName: item.sizeName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      notes: item.notes,
      modifiers: item.modifiers.map((modifier: any) => ({
        modifierGroupNameSnapshot: modifier.modifierGroupNameSnapshot,
        modifierOptionNameSnapshot: modifier.modifierOptionNameSnapshot,
        priceSnapshot: Number(modifier.priceSnapshot)
      }))
    }))
  };
};

export const getOrderById = async (id: string) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { modifiers: true } },
      statusHistory: true,
      customer: true,
      branch: true,
      driverAssignment: true,
      chat: true,
      payment: true
    }
  });

  if (!order) {
    throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found', [{ field: 'id', code: 'ORDER_NOT_FOUND' }]);
  }

  return serializeOrder(order);
};

export const getOrdersForCustomer = async ({ customerId, phone }: { customerId?: string; phone?: string }) => {
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        customerId ? { customerId } : undefined,
        phone ? { customerPhone: phone } : undefined
      ].filter(Boolean) as any
    },
    include: { items: { include: { modifiers: true } }, statusHistory: true, payment: true },
    orderBy: { createdAt: 'desc' }
  });

  return orders.map(serializeOrder);
};

export const updateOrderStatus = async (id: string, status: string, changedByUserId?: string, changedByRole: string = 'SYSTEM', reason?: string) => {
  if (!ORDER_STATUSES.includes(status as typeof ORDER_STATUSES[number])) {
    throw new ApiError(400, 'INVALID_ORDER_STATUS', 'Invalid status', [{ field: 'status', code: 'INVALID_ORDER_STATUS' }]);
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
    include: { items: { include: { modifiers: true } }, statusHistory: true, payment: true }
  });

  emitOrderUpdate(id, { event: 'order.status.changed', orderId: id, status });
  emitNotification(`order:${id}`, { event: 'order.status.changed', orderId: id, status });
  logger.info('Order status updated', { orderId: id, status, changedByRole });

  return serializeOrder(order);
};

export const listRestaurantOrders = async (branchId: string, filter?: { status?: string }) => {
  const orders = await prisma.order.findMany({
    where: {
      branchId,
      status: filter?.status
    },
    include: { items: { include: { modifiers: true } }, customer: true, statusHistory: true, payment: true },
    orderBy: { createdAt: 'desc' }
  });

  return orders.map(serializeOrder);
};

export const listDriverOrders = async (driverId: string) => {
  const orders = await prisma.order.findMany({
    where: {
      driverAssignment: {
        driverId
      }
    },
    include: { items: { include: { modifiers: true } }, customer: true, statusHistory: true, driverAssignment: true, payment: true },
    orderBy: { createdAt: 'desc' }
  });

  return orders.map(serializeOrder);
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
