import { Request, Response } from 'express';
import { getMenuByRestaurant } from '../services/menuService';

export const menuController = async (req: Request, res: Response) => {
  const menu = await getMenuByRestaurant(Number(req.params.restaurantId));
  res.json(menu);
};
