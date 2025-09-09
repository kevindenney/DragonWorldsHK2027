import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { validate, authSchemas } from '../middleware/validation';

const router = Router();

/**
 * @route POST /api/v1/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', 
  validate(authSchemas.register),
  authController.register
);

/**
 * @route POST /api/v1/auth/login
 * @desc Login user with email and password
 * @access Public
 */
router.post('/login', 
  validate(authSchemas.login),
  authController.login
);

/**
 * @route POST /api/v1/auth/login/token
 * @desc Login user with Firebase ID token
 * @access Public
 */
router.post('/login/token', 
  authController.loginWithToken
);

/**
 * @route POST /api/v1/auth/logout
 * @desc Logout current user
 * @access Private
 */
router.post('/logout', 
  authMiddleware,
  authController.logout
);

/**
 * @route POST /api/v1/auth/reset-password
 * @desc Request password reset
 * @access Public
 */
router.post('/reset-password', 
  validate(authSchemas.resetPassword),
  authController.resetPassword
);

/**
 * @route POST /api/v1/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.post('/change-password', 
  authMiddleware,
  validate(authSchemas.changePassword),
  authController.changePassword
);

/**
 * @route POST /api/v1/auth/verify-email
 * @desc Verify user email
 * @access Private
 */
router.post('/verify-email', 
  authMiddleware,
  authController.verifyEmail
);

/**
 * @route POST /api/v1/auth/send-verification
 * @desc Send email verification link
 * @access Private
 */
router.post('/send-verification', 
  authMiddleware,
  authController.sendEmailVerification
);

/**
 * @route POST /api/v1/auth/refresh-token
 * @desc Refresh access token
 * @access Private
 */
router.post('/refresh-token', 
  authMiddleware,
  authController.refreshToken
);

/**
 * @route GET /api/v1/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', 
  authMiddleware,
  authController.getProfile
);

/**
 * @route DELETE /api/v1/auth/account
 * @desc Delete user account
 * @access Private
 */
router.delete('/account', 
  authMiddleware,
  authController.deleteAccount
);

/**
 * @route GET /api/v1/auth/check
 * @desc Check authentication status
 * @access Private
 */
router.get('/check', 
  authMiddleware,
  authController.checkAuth
);

/**
 * @route POST /api/v1/auth/validate-token
 * @desc Validate Firebase ID token
 * @access Public
 */
router.post('/validate-token', 
  authController.validateToken
);

// Admin routes
/**
 * @route GET /api/v1/auth/stats
 * @desc Get authentication statistics
 * @access Admin
 */
router.get('/stats', 
  authMiddleware,
  authController.getAuthStats
);

/**
 * @route POST /api/v1/auth/revoke-sessions/:userId
 * @desc Revoke all user sessions
 * @access Admin
 */
router.post('/revoke-sessions/:userId', 
  authMiddleware,
  authController.revokeUserSessions
);

export default router;