import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'joi';
import logger from '../utils/logger';
import { config } from '../config/environment';

interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  details?: any;
  stack?: string;
}

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error
  logger.logError(error, {
    path: req.path,
    method: req.method,
    userId: req.user?.uid,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  const errorResponse: ErrorResponse = {
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    statusCode: 500,
    timestamp: new Date().toISOString(),
    path: req.path
  };

  // Handle specific error types
  if (error.name === 'ValidationError') {
    // Joi validation error
    const validationError = error as ValidationError;
    errorResponse.error = 'Validation Error';
    errorResponse.message = 'Request validation failed';
    errorResponse.statusCode = 400;
    errorResponse.details = validationError.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));
  } else if (error.code === 'auth/id-token-expired') {
    // Firebase auth token expired
    errorResponse.error = 'Token Expired';
    errorResponse.message = 'Authentication token has expired';
    errorResponse.statusCode = 401;
  } else if (error.code === 'auth/id-token-revoked') {
    // Firebase auth token revoked
    errorResponse.error = 'Token Revoked';
    errorResponse.message = 'Authentication token has been revoked';
    errorResponse.statusCode = 401;
  } else if (error.code === 'auth/user-not-found') {
    // Firebase user not found
    errorResponse.error = 'User Not Found';
    errorResponse.message = 'The specified user does not exist';
    errorResponse.statusCode = 404;
  } else if (error.code === 'auth/email-already-exists') {
    // Firebase email already exists
    errorResponse.error = 'Email Already Exists';
    errorResponse.message = 'A user with this email already exists';
    errorResponse.statusCode = 409;
  } else if (error.code === 'auth/invalid-email') {
    // Firebase invalid email
    errorResponse.error = 'Invalid Email';
    errorResponse.message = 'The provided email address is invalid';
    errorResponse.statusCode = 400;
  } else if (error.code === 'auth/weak-password') {
    // Firebase weak password
    errorResponse.error = 'Weak Password';
    errorResponse.message = 'Password should be at least 6 characters';
    errorResponse.statusCode = 400;
  } else if (error.code === 'permission-denied') {
    // Firestore permission denied
    errorResponse.error = 'Permission Denied';
    errorResponse.message = 'You do not have permission to perform this action';
    errorResponse.statusCode = 403;
  } else if (error.code === 'not-found') {
    // Firestore document not found
    errorResponse.error = 'Not Found';
    errorResponse.message = 'The requested resource was not found';
    errorResponse.statusCode = 404;
  } else if (error.code === 'already-exists') {
    // Firestore document already exists
    errorResponse.error = 'Already Exists';
    errorResponse.message = 'The resource already exists';
    errorResponse.statusCode = 409;
  } else if (error.code === 'LIMIT_FILE_SIZE') {
    // Multer file size limit
    errorResponse.error = 'File Too Large';
    errorResponse.message = 'The uploaded file exceeds the size limit';
    errorResponse.statusCode = 413;
  } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    // Multer unexpected file
    errorResponse.error = 'Unexpected File';
    errorResponse.message = 'An unexpected file was uploaded';
    errorResponse.statusCode = 400;
  } else if (error.name === 'CastError') {
    // MongoDB cast error
    errorResponse.error = 'Invalid Data Format';
    errorResponse.message = 'The provided data format is invalid';
    errorResponse.statusCode = 400;
  } else if (error.name === 'SyntaxError' && 'body' in error) {
    // JSON parsing error
    errorResponse.error = 'Invalid JSON';
    errorResponse.message = 'Request body contains invalid JSON';
    errorResponse.statusCode = 400;
  } else if (error.statusCode) {
    // Custom error with status code
    errorResponse.error = error.name || 'Error';
    errorResponse.message = error.message || 'An error occurred';
    errorResponse.statusCode = error.statusCode;
    if (error.details) {
      errorResponse.details = error.details;
    }
  }

  // Add stack trace in development mode
  if (config.nodeEnv === 'development') {
    errorResponse.stack = error.stack;
  }

  // Send error response
  res.status(errorResponse.statusCode).json(errorResponse);
};

/**
 * Create a custom error with status code
 */
export class CustomError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'CustomError';
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
  }
}

/**
 * Async error wrapper to catch promise rejections
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new CustomError(
    `Route ${req.originalUrl} not found`,
    404,
    {
      method: req.method,
      path: req.originalUrl
    }
  );
  
  next(error);
};

/**
 * Validation error helper
 */
export const createValidationError = (message: string, field?: string, value?: any): CustomError => {
  const details = field ? [{ field, message, value }] : undefined;
  return new CustomError(message, 400, details);
};

/**
 * Authorization error helper
 */
export const createAuthError = (message: string = 'Authentication required'): CustomError => {
  return new CustomError(message, 401);
};

/**
 * Permission error helper
 */
export const createPermissionError = (message: string = 'Insufficient permissions'): CustomError => {
  return new CustomError(message, 403);
};

/**
 * Not found error helper
 */
export const createNotFoundError = (resource: string = 'Resource'): CustomError => {
  return new CustomError(`${resource} not found`, 404);
};

/**
 * Conflict error helper
 */
export const createConflictError = (message: string): CustomError => {
  return new CustomError(message, 409);
};

export default errorHandler;