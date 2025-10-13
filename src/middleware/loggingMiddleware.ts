import { Request, Response, NextFunction } from 'express';
import { serverLogger } from '../services/serverLogger';

export interface LoggedRequest extends Request {
  startTime?: number;
  userId?: string;
}

export const loggingMiddleware = (req: LoggedRequest, res: Response, next: NextFunction): void => {
  // Record start time
  req.startTime = Date.now();
  
  // Extract user ID from token if available
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      // In a real implementation, you would decode the JWT token here
      // For now, we'll just extract a placeholder
      req.userId = 'extracted-from-token';
    } catch (error) {
      // Token is invalid, continue without user ID
    }
  }

  // Log the request
  serverLogger.info(
    `Incoming request: ${req.method} ${req.path}`,
    'HTTP_REQUEST',
    {
      method: req.method,
      path: req.path,
      query: req.query,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
        'authorization': req.headers.authorization ? '[REDACTED]' : undefined
      }
    },
    req.userId,
    req.ip,
    req.headers['user-agent'] as string
  );

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const responseTime = req.startTime ? Date.now() - req.startTime : 0;
    
    // Log the response
    serverLogger.access(
      req.method,
      req.path,
      res.statusCode,
      responseTime,
      req.userId,
      req.ip,
      req.headers['user-agent'] as string
    );

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

export const errorLoggingMiddleware = (error: Error, req: LoggedRequest, res: Response, next: NextFunction): void => {
  const responseTime = req.startTime ? Date.now() - req.startTime : 0;
  
  // Log the error
  serverLogger.error(
    `Request error: ${error.message}`,
    'HTTP_ERROR',
    {
      method: req.method,
      path: req.path,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      responseTime
    },
    req.userId,
    req.ip,
    req.headers['user-agent'] as string
  );

  // Log security-related errors
  if (res.statusCode === 401 || res.statusCode === 403) {
    serverLogger.security(
      `Security violation: ${error.message}`,
      'SECURITY_VIOLATION',
      {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        error: error.message
      },
      req.userId,
      req.ip,
      req.headers['user-agent'] as string
    );
  }

  next(error);
};
