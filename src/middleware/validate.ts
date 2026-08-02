import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { mapZodErrorToPayload } from '../utils/errorResponse';

export const validate = (schema: z.ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json(mapZodErrorToPayload(error));
        return;
      }
      next(error);
    }
  };
};
