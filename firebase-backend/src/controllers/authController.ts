import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { CustomError, asyncHandler } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { ICreateUser } from '../models/User';

export class AuthController {
  /**
   * Register a new user
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, displayName, phoneNumber, photoURL } = req.body;

    const userData: ICreateUser = {
      email: email.toLowerCase().trim(),
      password,
      displayName: displayName.trim(),
      phoneNumber: phoneNumber?.trim(),
      photoURL: photoURL?.trim()
    };

    const result = await authService.register(userData);

    logger.info('User registered successfully', {
      userId: result.user.uid,
      email: result.user.email
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  });

  /**
   * Login user with email and password
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    if (!email || !password) {
      throw new CustomError('Email and password are required', 400);
    }

    const result = await authService.login(
      email.toLowerCase().trim(),
      password,
      ipAddress,
      userAgent
    );

    logger.info('User logged in successfully', {
      userId: result.user.uid,
      email: result.user.email,
      ip: ipAddress
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  });

  /**
   * Login with Firebase ID token
   */
  loginWithToken = asyncHandler(async (req: Request, res: Response) => {
    const { idToken } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    if (!idToken) {
      throw new CustomError('ID token is required', 400);
    }

    const result = await authService.loginWithToken(idToken, ipAddress, userAgent);

    logger.info('Token login successful', {
      userId: result.user.uid,
      email: result.user.email,
      ip: ipAddress
    });

    res.json({
      success: true,
      message: 'Token authentication successful',
      data: result
    });
  });

  /**
   * Logout user
   */
  logout = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.uid;

    await authService.logout(userId);

    logger.info('User logged out successfully', { userId });

    res.json({
      success: true,
      message: 'Logout successful'
    });
  });

  /**
   * Reset password
   */
  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      throw new CustomError('Email is required', 400);
    }

    await authService.resetPassword(email.toLowerCase().trim());

    logger.info('Password reset requested', { email });

    res.json({
      success: true,
      message: 'Password reset email sent (if account exists)'
    });
  });

  /**
   * Change password
   */
  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const { newPassword } = req.body;
    const userId = req.user!.uid;

    if (!newPassword) {
      throw new CustomError('New password is required', 400);
    }

    if (newPassword.length < 6) {
      throw new CustomError('Password must be at least 6 characters long', 400);
    }

    await authService.changePassword(userId, newPassword);

    logger.info('Password changed successfully', { userId });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  });

  /**
   * Verify email
   */
  verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.uid;

    await authService.verifyEmail(userId);

    logger.info('Email verified successfully', { userId });

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  });

  /**
   * Refresh access token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.uid;

    const tokens = await authService.refreshToken(userId);

    logger.info('Token refreshed successfully', { userId });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: tokens
    });
  });

  /**
   * Get current user profile
   */
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.uid;

    // Get user from userService to get the most up-to-date profile
    const { userService } = await import('../services/userService');
    const user = await userService.getUserById(userId);

    res.json({
      success: true,
      data: user
    });
  });

  /**
   * Delete user account
   */
  deleteAccount = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.uid;
    const { password } = req.body;

    // For security, require password confirmation for account deletion
    if (!password) {
      throw new CustomError('Password confirmation required for account deletion', 400);
    }

    // Verify password by attempting login
    try {
      await authService.login(req.user!.email!, password);
    } catch (error) {
      throw new CustomError('Invalid password', 401);
    }

    await authService.deleteAccount(userId);

    logger.info('Account deleted successfully', { userId });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  });

  /**
   * Check authentication status
   */
  checkAuth = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;

    res.json({
      success: true,
      message: 'User is authenticated',
      data: {
        uid: user.uid,
        email: user.email,
        role: user.role,
        emailVerified: user.email_verified,
        iat: user.iat,
        exp: user.exp
      }
    });
  });

  /**
   * Validate token (public endpoint)
   */
  validateToken = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
      throw new CustomError('Token is required', 400);
    }

    try {
      const decodedToken = await import('../config/firebase')
        .then(module => module.default.verifyIdToken(token));

      res.json({
        success: true,
        message: 'Token is valid',
        data: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified,
          iat: decodedToken.iat,
          exp: decodedToken.exp
        }
      });
    } catch (error) {
      throw new CustomError('Invalid token', 401);
    }
  });

  /**
   * Get authentication statistics (admin only)
   */
  getAuthStats = asyncHandler(async (req: Request, res: Response) => {
    // This would typically require admin permissions
    const { userService } = await import('../services/userService');
    const stats = await userService.getUserStats();

    res.json({
      success: true,
      data: stats
    });
  });

  /**
   * Revoke all user sessions (admin action)
   */
  revokeUserSessions = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!userId) {
      throw new CustomError('User ID is required', 400);
    }

    const firebaseConfig = await import('../config/firebase').then(m => m.default);
    await firebaseConfig.auth.revokeRefreshTokens(userId);

    logger.info('User sessions revoked', { 
      userId, 
      revokedBy: req.user!.uid 
    });

    res.json({
      success: true,
      message: 'All user sessions have been revoked'
    });
  });

  /**
   * Send email verification
   */
  sendEmailVerification = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.uid;
    const email = req.user!.email;

    if (!email) {
      throw new CustomError('No email associated with this account', 400);
    }

    // Generate email verification link
    const firebaseConfig = await import('../config/firebase').then(m => m.default);
    const link = await firebaseConfig.auth.generateEmailVerificationLink(email);

    // In a real application, you would send this via email service
    logger.info('Email verification link generated', { userId, email, link });

    res.json({
      success: true,
      message: 'Email verification link sent',
      ...(process.env.NODE_ENV === 'development' && { link }) // Only include in development
    });
  });
}

// Export singleton instance
export const authController = new AuthController();
export default authController;