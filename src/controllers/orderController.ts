import { Request, Response } from 'express';
import { createOrder, getOrderById, getOrdersForCustomer, updateOrderStatus, listRestaurantOrders, listDriverOrders } from '../services/orderService';

export const createOrderController = async (req: Request, res: Response) => {
  const order = await createOrder(req.body);
  res.status(201).json(order);
};

export const getMyOrdersController = async (req: Request, res: Response) => {
  const orders = await getOrdersForCustomer({ customerId: Number(req.query.customerId), phone: String(req.query.phone || '') });
  res.json(orders);
};

export const getOrderController = async (req: Request, res: Response) => {
  const order = await getOrderById(Number(req.params.id));
  res.json(order);
};

export const updateOrderStatusController = async (req: Request, res: Response) => {
  const updated = await updateOrderStatus(Number(req.params.id), req.body.status, req.body.actorType || 'SYSTEM', req.body.actorId || null, req.body.comment);
  res.json(updated);
};

export const restaurantOrdersController = async (req: Request, res: Response) => {
  const orders = await listRestaurantOrders(Number(req.query.restaurantId));
  res.json(orders);
};

export const driverOrdersController = async (req: Request, res: Response) => {
  const orders = await listDriverOrders(Number(req.query.driverId));
  res.json(orders);
};
