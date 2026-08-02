import { NextFunction, Request, Response } from 'express';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import { ErrorItem, buildErrorResponse } from '../utils/errorResponse';

export class ApiError extends Error {
  status: number;
  code: string;
  errors: ErrorItem[];
  details?: unknown;

  constructor(status: number, code: string, message: string, errors: ErrorItem[] = [], details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.details = details;
  }
}

export const errorHandler = (err: Error | ApiError, req: Request, res: Response, next: NextFunction) => {
  const status = err instanceof ApiError ? err.status : StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || getReasonPhrase(status);
  const code = err instanceof ApiError ? err.code : 'INTERNAL_SERVER_ERROR';
  const errors = err instanceof ApiError ? err.errors : [];

  res.status(status).json(buildErrorResponse({
    code,
    message,
    errors
  }));
};
