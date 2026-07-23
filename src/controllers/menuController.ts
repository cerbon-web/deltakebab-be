import { Request, Response } from 'express';
import { getBranchMenu } from '../services/menuService';

export const menuController = async (req: Request, res: Response) => {
  const lang = String(req.query.lang ?? 'pl');
  const menu = await getBranchMenu(req.params.branchId, lang);
  res.json(menu);
};
