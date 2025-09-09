import express from 'express';
import { oauthController } from '../controllers/oauthController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param } from 'express-validator';
import { AuthProvider } from '../models/User';

const router = express.Router();

// OAuth configuration endpoints (public)
router.get('/config', oauthController.getOAuthConfig);
router.get('/providers/available', oauthController.getAvailableProviders);

// OAuth callback endpoints (public)
router.get('/callback/:provider', oauthController.oauthCallback);

// OAuth authentication endpoints (public)
router.post('/google', [
  body('idToken')
    .notEmpty()
    .withMessage('ID token is required')
    .isString()
    .withMessage('ID token must be a string'),
  validateRequest
], oauthController.loginWithGoogle);

router.post('/apple', [
  body('idToken')
    .notEmpty()
    .withMessage('ID token is required')
    .isString()
    .withMessage('ID token must be a string'),
  validateRequest
], oauthController.loginWithApple);

// OAuth signup endpoint (public)
router.post('/signup', [
  body('provider')
    .notEmpty()
    .withMessage('Provider is required')
    .isIn(Object.values(AuthProvider))
    .withMessage('Invalid OAuth provider'),
  body('idToken')
    .notEmpty()
    .withMessage('ID token is required')
    .isString()
    .withMessage('ID token must be a string'),
  body('userData')
    .notEmpty()
    .withMessage('User data is required')
    .isObject()
    .withMessage('User data must be an object'),
  body('userData.email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('userData.displayName')
    .notEmpty()
    .withMessage('Display name is required')
    .isString()
    .withMessage('Display name must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('Display name must be between 1 and 100 characters'),
  body('providerData')
    .notEmpty()
    .withMessage('Provider data is required')
    .isObject()
    .withMessage('Provider data must be an object'),
  body('accessToken')
    .optional()
    .isString()
    .withMessage('Access token must be a string'),
  body('refreshToken')
    .optional()
    .isString()
    .withMessage('Refresh token must be a string'),
  body('role')
    .optional()
    .isIn(['user', 'admin', 'superadmin'])
    .withMessage('Invalid role'),
  validateRequest
], oauthController.signupWithOAuth);

// OAuth provider management endpoints (authenticated)
router.use(authenticateToken); // All routes below require authentication

router.get('/providers', oauthController.getUserProviders);

router.post('/link', [
  body('provider')
    .notEmpty()
    .withMessage('Provider is required')
    .isIn(Object.values(AuthProvider))
    .withMessage('Invalid OAuth provider'),
  body('idToken')
    .notEmpty()
    .withMessage('ID token is required')
    .isString()
    .withMessage('ID token must be a string'),
  body('accessToken')
    .optional()
    .isString()
    .withMessage('Access token must be a string'),
  body('refreshToken')
    .optional()
    .isString()
    .withMessage('Refresh token must be a string'),
  body('linkExistingAccount')
    .optional()
    .isBoolean()
    .withMessage('Link existing account must be a boolean'),
  validateRequest
], oauthController.linkProvider);

router.delete('/unlink/:provider', [
  param('provider')
    .notEmpty()
    .withMessage('Provider is required')
    .isIn(Object.values(AuthProvider))
    .withMessage('Invalid OAuth provider'),
  validateRequest
], oauthController.unlinkProvider);

router.put('/primary', [
  body('provider')
    .notEmpty()
    .withMessage('Provider is required')
    .isIn(Object.values(AuthProvider))
    .withMessage('Invalid OAuth provider'),
  validateRequest
], oauthController.setPrimaryProvider);

export default router;