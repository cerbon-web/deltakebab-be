import { Request, Response } from 'express';
import { resetDatabase, exportDatabase, importDatabase } from '../services/adminService';

export const resetDatabaseController = async (req: Request, res: Response) => {
  const result = await resetDatabase(String(req.body?.confirmation || ''));
  res.json(result);
};

export const exportDatabaseController = async (_req: Request, res: Response) => {
  const result = await exportDatabase();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="database-export.json"');
  res.send(JSON.stringify(result.payload, null, 2));
};

export const importDatabaseController = async (req: Request, res: Response) => {
  const payload = req.body;
  if (!payload || typeof payload !== 'object') {
    res.status(400).json({ status: 'error', message: 'Expected a JSON object payload' });
    return;
  }

  const clearExisting = Boolean(req.body?.clearExisting);
  const result = await importDatabase(payload as Record<string, unknown[]>, clearExisting);
  res.json(result);
};
