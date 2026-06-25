import { NextFunction, Request, Response } from 'express';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const errorHandler = (err: Error | ApiError, req: Request, res: Response, next: NextFunction) => {
  const status = err instanceof ApiError ? err.status : StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || getReasonPhrase(status);

  res.status(status).json({
    status: 'error',
    message,
    details: err instanceof ApiError ? err.details : undefined
  });
};
