import { Request, Response } from 'express';
import { ApiError } from '../middleware/errorHandler';
import { buildErrorResponse } from '../utils/errorResponse';
import { prisma } from '../database/prisma';
import { createOrder, getOrderById, getOrdersForCustomer, updateOrderStatus, listRestaurantOrders, listDriverOrders } from '../services/orderService';
import { AuthRequest } from '../middleware/auth';

const assertBranchAccess = async (user: AuthRequest['user'] | undefined, branchId: string) => {
  if (!user) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Unauthorized', []);
  }

  if (user.roles.includes('SUPER_ADMIN')) {
    return;
  }

  const access = await prisma.restaurantStaff.findFirst({
    where: {
      userId: user.id,
      branchId
    }
  });

  if (!access) {
    throw new ApiError(403, 'FORBIDDEN', 'Insufficient permissions', []);
  }
};

export const createOrderController = async (req: Request, res: Response) => {
  try {
    const order = await createOrder(req.body);
    res.status(201).json(order);
  } catch (error: any) {
    const statusCode = error instanceof ApiError ? error.status : (error?.statusCode ?? 500);
    const code = error instanceof ApiError ? error.code : (error?.code ?? 'ORDER_CREATE_FAILED');
    const message = error?.message ?? 'Unable to create order';
    const errors = error instanceof ApiError ? error.errors : (error?.errors ?? []);

    res.status(statusCode).json(buildErrorResponse({
      code,
      message,
      errors
    }));
  }
};

export const getMyOrdersController = async (req: Request, res: Response) => {
  const customerId = typeof req.query.customerId === 'string' ? req.query.customerId : undefined;
  const orders = await getOrdersForCustomer({ customerId, phone: String(req.query.phone || '') });
  res.json(orders);
};

export const getOrderController = async (req: Request, res: Response) => {
  const order = await getOrderById(req.params.id);
  res.json(order);
};

export const updateOrderStatusController = async (req: AuthRequest, res: Response) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });

  if (!order) {
    throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found', [{ field: 'id', code: 'ORDER_NOT_FOUND' }]);
  }

  await assertBranchAccess(req.user, order.branchId);
  const updated = await updateOrderStatus(req.params.id, req.body.status, req.body.actorId || null, req.body.actorType || 'SYSTEM', req.body.comment);
  res.json(updated);
};

export const restaurantOrdersController = async (req: AuthRequest, res: Response) => {
  const branchId = String(req.query.branchId || req.query.restaurantId || '');

  if (!branchId) {
    throw new ApiError(400, 'BRANCH_REQUIRED', 'Branch id is required', [{ field: 'branchId', code: 'BRANCH_REQUIRED' }]);
  }

  await assertBranchAccess(req.user, branchId);
  const orders = await listRestaurantOrders(branchId);
  res.json(orders);
};

export const driverOrdersController = async (req: Request, res: Response) => {
  const orders = await listDriverOrders(String(req.query.driverId || ''));
  res.json(orders);
};
