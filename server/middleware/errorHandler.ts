import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // The full error, including the stack, belongs in the server log.
  console.error('[ServerError]', err);

  const status = err.status || 500;

  // Stack traces are never sent to a client. They previously shipped whenever
  // NODE_ENV !== 'production', which meant a plain 403 in development returned
  // absolute source paths and internal project structure to the browser.
  // Set DEBUG_ERROR_RESPONSES=true to opt in locally.
  const exposeStack = process.env.DEBUG_ERROR_RESPONSES === 'true';

  // An unexpected failure should not echo its internal message either: those
  // often quote SQL or file paths. Deliberate errors carry an explicit status,
  // so their messages are written to be read by users.
  const message =
    status >= 500 && !exposeStack
      ? 'Something went wrong. Please try again.'
      : err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    ...(exposeStack && err.stack ? { stack: err.stack } : {}),
  });
};
