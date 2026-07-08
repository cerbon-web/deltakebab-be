import { Request, Response } from 'express';
import { getBranchMenu } from '../services/menuService';

export const menuController = async (req: Request, res: Response) => {
  const menu = await getBranchMenu(req.params.branchId);
  res.json(menu);
};
