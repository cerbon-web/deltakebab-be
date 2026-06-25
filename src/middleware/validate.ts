import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ status: 'error', message: 'Validation failed', details: error.flatten() });
        return;
      }
      next(error);
    }
  };
};
