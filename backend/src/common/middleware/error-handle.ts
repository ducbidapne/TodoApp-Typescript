import { Request, Response, NextFunction } from 'express';

interface Error {
  status?: number;
  message?: string;
}

export const ErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  console.error(`Error: ${message}`);
  res.status(status).json({ error: message });
};
