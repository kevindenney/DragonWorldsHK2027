import { Request, Response, NextFunction } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import firebaseConfig from '../config/firebase';
import logger from '../utils/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: DecodedIdToken & {
        role?: string;
        permissions?: string[];
      };
      token?: string;
    }
  }
}

interface AuthenticatedRequest extends Request {
  user: DecodedIdToken & {
    role?: string;
    permissions?: string[];
  };
}

/**
 * Middleware to verify Firebase ID token
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization header provided'
      });
      return;
    }

    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authorization header format. Expected "Bearer <token>"'
      });
      return;
    }

    const idToken = authHeader.substring(7); // Remove 'Bearer ' prefix
    req.token = idToken;

    // Verify the Firebase ID token
    const decodedToken = await firebaseConfig.verifyIdToken(idToken);
    
    // Add user info to request object
    req.user = {
      ...decodedToken,
      role: decodedToken.role || 'user',
      permissions: decodedToken.permissions || []
    };

    logger.logAuth('Token verified', decodedToken.uid, decodedToken.email, true);
    next();

  } catch (error) {
    logger.logAuth('Token verification failed', undefined, undefined, false);
    logger.logError(error as Error, { middleware: 'auth' });

    if ((error as any).code === 'auth/id-token-expired') {
      res.status(401).json({
        error: 'Token Expired',
        message: 'The provided token has expired'
      });
      return;
    }

    if ((error as any).code === 'auth/id-token-revoked') {
      res.status(401).json({
        error: 'Token Revoked',
        message: 'The provided token has been revoked'
      });
      return;
    }

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
      return;
    }

    const userRole = req.user.role || 'user';
    
    if (!roles.includes(userRole)) {
      logger.logSecurity('Insufficient permissions', {
        userId: req.user.uid,
        userRole,
        requiredRoles: roles,
        path: req.path
      }, 'warn');

      res.status(403).json({
        error: 'Forbidden',
        message: `Insufficient permissions. Required roles: ${roles.join(', ')}`
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user has required permission
 */
export const requirePermission = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
      return;
    }

    const userPermissions = req.user.permissions || [];
    
    const hasPermission = permissions.some(permission => 
      userPermissions.includes(permission) || 
      userPermissions.includes('*') // Wildcard permission
    );

    if (!hasPermission) {
      logger.logSecurity('Insufficient permissions', {
        userId: req.user.uid,
        userPermissions,
        requiredPermissions: permissions,
        path: req.path
      }, 'warn');

      res.status(403).json({
        error: 'Forbidden',
        message: `Insufficient permissions. Required permissions: ${permissions.join(', ')}`
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = requireRole('admin', 'superadmin');

/**
 * Middleware to check if user owns the resource or is admin
 */
export const requireOwnershipOrAdmin = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
      return;
    }

    const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
    const currentUserId = req.user.uid;
    const userRole = req.user.role || 'user';

    // Allow if user owns the resource or is admin
    if (resourceUserId === currentUserId || ['admin', 'superadmin'].includes(userRole)) {
      next();
      return;
    }

    logger.logSecurity('Unauthorized resource access attempt', {
      userId: currentUserId,
      resourceUserId,
      path: req.path,
      method: req.method
    }, 'warn');

    res.status(403).json({
      error: 'Forbidden',
      message: 'You can only access your own resources'
    });
  };
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      next();
      return;
    }

    const idToken = authHeader.substring(7);
    const decodedToken = await firebaseConfig.verifyIdToken(idToken);
    
    req.user = {
      ...decodedToken,
      role: decodedToken.role || 'user',
      permissions: decodedToken.permissions || []
    };

    logger.logAuth('Optional token verified', decodedToken.uid, decodedToken.email, true);
    next();

  } catch (error) {
    // Log error but don't fail the request
    logger.logAuth('Optional token verification failed', undefined, undefined, false);
    next();
  }
};

/**
 * Middleware to extract and validate API key (for service-to-service communication)
 */
export const requireApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];

  if (!apiKey) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'API key required'
    });
    return;
  }

  if (!validApiKeys.includes(apiKey)) {
    logger.logSecurity('Invalid API key used', {
      providedKey: apiKey.substring(0, 8) + '...',
      ip: req.ip,
      path: req.path
    }, 'error');

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key'
    });
    return;
  }

  logger.logSecurity('Valid API key used', {
    keyPrefix: apiKey.substring(0, 8) + '...',
    path: req.path
  });

  next();
};

// Aliases for consistency with OAuth routes\nexport const authenticateToken = authMiddleware;\nexport const optionalAuth = optionalAuthMiddleware;\n\nexport { AuthenticatedRequest };