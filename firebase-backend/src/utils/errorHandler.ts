export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleFirebaseError = (error: any): AppError => {
  const errorCode = error.code || 'unknown';
  const errorMessage = error.message || 'An unknown error occurred';

  switch (errorCode) {
    case 'auth/user-not-found':
      return new AppError('User not found', 404);
    case 'auth/wrong-password':
      return new AppError('Invalid password', 401);
    case 'auth/email-already-in-use':
      return new AppError('Email already in use', 409);
    case 'auth/weak-password':
      return new AppError('Password is too weak', 400);
    case 'auth/invalid-email':
      return new AppError('Invalid email format', 400);
    case 'auth/user-disabled':
      return new AppError('User account has been disabled', 403);
    case 'auth/too-many-requests':
      return new AppError('Too many requests. Please try again later', 429);
    case 'permission-denied':
      return new AppError('Permission denied', 403);
    case 'not-found':
      return new AppError('Document not found', 404);
    case 'already-exists':
      return new AppError('Document already exists', 409);
    case 'resource-exhausted':
      return new AppError('Resource exhausted', 429);
    case 'failed-precondition':
      return new AppError('Failed precondition', 400);
    case 'out-of-range':
      return new AppError('Request out of range', 400);
    case 'unimplemented':
      return new AppError('Operation not implemented', 501);
    case 'internal':
      return new AppError('Internal server error', 500);
    case 'unavailable':
      return new AppError('Service unavailable', 503);
    case 'data-loss':
      return new AppError('Data loss occurred', 500);
    default:
      return new AppError(errorMessage, 500);
  }
};

export const logError = (error: Error | AppError, context?: string): void => {
  const timestamp = new Date().toISOString();
  const contextInfo = context ? ` [Context: ${context}]` : '';
  
  console.error(`[${timestamp}]${contextInfo} Error:`, {
    message: error.message,
    stack: error.stack,
    ...(error instanceof AppError && {
      statusCode: error.statusCode,
      isOperational: error.isOperational
    })
  });
};