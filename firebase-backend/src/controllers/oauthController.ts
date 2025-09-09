import { Request, Response, NextFunction } from 'express';
import { oauthService } from '../services/oauthService';
import { config } from '../config/environment';
import { getClientFirebaseConfig, getEnabledOAuthProviders, getOAuthRedirectConfig } from '../config/clientFirebase';
import { AuthProvider, IOAuthLinkingRequest, ICreateOAuthUser } from '../models/User';
import logger from '../utils/logger';
import { CustomError } from '../middleware/errorHandler';

/**
 * OAuth Controller for handling OAuth authentication endpoints
 */
export class OAuthController {

  /**
   * Get OAuth configuration for client applications
   */
  async getOAuthConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientConfig = getClientFirebaseConfig();
      const oauthProviders = getEnabledOAuthProviders();
      const redirects = getOAuthRedirectConfig();

      res.status(200).json({
        success: true,
        data: {
          firebase: clientConfig,
          providers: oauthProviders,
          redirects: redirects,
          features: config.features
        }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Login with Google OAuth
   * POST /auth/oauth/google
   */
  async loginWithGoogle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idToken } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      if (!idToken) {
        throw new CustomError('ID token is required', 400);
      }

      if (!config.oauth.google.enabled) {
        throw new CustomError('Google OAuth is not enabled', 403);
      }

      const result = await oauthService.loginWithGoogle(idToken, ipAddress, userAgent);

      res.status(200).json({
        success: true,
        message: 'Google login successful',
        data: result
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Login with Apple OAuth  
   * POST /auth/oauth/apple
   */
  async loginWithApple(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idToken } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      if (!idToken) {
        throw new CustomError('ID token is required', 400);
      }

      if (!config.oauth.apple.enabled) {
        throw new CustomError('Apple OAuth is not enabled', 403);
      }

      const result = await oauthService.loginWithApple(idToken, ipAddress, userAgent);

      res.status(200).json({
        success: true,
        message: 'Apple login successful',
        data: result
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Create user with OAuth provider
   * POST /auth/oauth/signup
   */
  async signupWithOAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        provider, 
        idToken, 
        accessToken, 
        refreshToken, 
        userData, 
        providerData,
        role 
      } = req.body;

      if (!provider || !idToken || !userData || !providerData) {
        throw new CustomError('Provider, ID token, user data, and provider data are required', 400);
      }

      // Validate provider
      if (!Object.values(AuthProvider).includes(provider)) {
        throw new CustomError('Invalid OAuth provider', 400);
      }

      // Check if provider is enabled
      const isProviderEnabled = this.isProviderEnabled(provider);
      if (!isProviderEnabled) {
        throw new CustomError(`${provider} OAuth is not enabled`, 403);
      }

      const oauthUserData: ICreateOAuthUser = {
        provider,
        idToken,
        accessToken,
        refreshToken,
        userData,
        providerData,
        role
      };

      const result = await oauthService.createOAuthUser(oauthUserData);

      res.status(201).json({
        success: true,
        message: 'OAuth user created successfully',
        data: result
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Link OAuth provider to existing user
   * POST /auth/oauth/link
   */
  async linkProvider(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        throw new CustomError('Authentication required', 401);
      }

      const { 
        provider, 
        idToken, 
        accessToken, 
        refreshToken, 
        linkExistingAccount 
      } = req.body;

      if (!provider || !idToken) {
        throw new CustomError('Provider and ID token are required', 400);
      }

      // Validate provider
      if (!Object.values(AuthProvider).includes(provider)) {
        throw new CustomError('Invalid OAuth provider', 400);
      }

      // Check if provider is enabled
      const isProviderEnabled = this.isProviderEnabled(provider);
      if (!isProviderEnabled) {
        throw new CustomError(`${provider} OAuth is not enabled`, 403);
      }

      const linkingRequest: IOAuthLinkingRequest = {
        userId,
        provider,
        idToken,
        accessToken,
        refreshToken,
        linkExistingAccount: linkExistingAccount || false
      };

      const result = await oauthService.linkOAuthProvider(linkingRequest);

      res.status(200).json({
        success: true,
        message: `${provider} provider linked successfully`,
        data: result
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Unlink OAuth provider from user
   * DELETE /auth/oauth/unlink/:provider
   */
  async unlinkProvider(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        throw new CustomError('Authentication required', 401);
      }

      const { provider } = req.params;

      if (!provider) {
        throw new CustomError('Provider is required', 400);
      }

      // Validate provider
      if (!Object.values(AuthProvider).includes(provider as AuthProvider)) {
        throw new CustomError('Invalid OAuth provider', 400);
      }

      const result = await oauthService.unlinkOAuthProvider(userId, provider as AuthProvider);

      res.status(200).json({
        success: true,
        message: `${provider} provider unlinked successfully`,
        data: result
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's linked OAuth providers
   * GET /auth/oauth/providers
   */
  async getUserProviders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        throw new CustomError('Authentication required', 401);
      }

      const result = await oauthService.getUserProviders(userId);

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Set primary OAuth provider
   * PUT /auth/oauth/primary
   */
  async setPrimaryProvider(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        throw new CustomError('Authentication required', 401);
      }

      const { provider } = req.body;

      if (!provider) {
        throw new CustomError('Provider is required', 400);
      }

      // Validate provider
      if (!Object.values(AuthProvider).includes(provider)) {
        throw new CustomError('Invalid OAuth provider', 400);
      }

      const result = await oauthService.setPrimaryProvider(userId, provider);

      res.status(200).json({
        success: true,
        message: `${provider} set as primary provider`,
        data: result
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * OAuth callback handler (for web flows)
   * GET /auth/oauth/callback/:provider
   */
  async oauthCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { provider } = req.params;
      const { code, state, error } = req.query;

      if (error) {
        logger.error('OAuth callback error', { provider, error });
        return res.redirect(`${config.oauth.errorRedirect}?error=${error}`);
      }

      if (!code) {
        logger.error('OAuth callback missing code', { provider });
        return res.redirect(`${config.oauth.errorRedirect}?error=missing_code`);
      }

      // Handle different providers
      switch (provider) {
        case 'google':
          await this.handleGoogleCallback(req, res, code as string, state as string);
          break;
        case 'apple':
          await this.handleAppleCallback(req, res, code as string, state as string);
          break;
        default:
          throw new CustomError('Unsupported OAuth provider', 400);
      }

    } catch (error) {
      logger.error('OAuth callback error', { error });
      res.redirect(`${config.oauth.errorRedirect}?error=callback_failed`);
    }
  }

  /**
   * Get available OAuth providers
   * GET /auth/oauth/providers/available
   */
  async getAvailableProviders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const providers = getEnabledOAuthProviders();
      const availableProviders = [];

      for (const [providerKey, providerConfig] of Object.entries(providers)) {
        if (providerConfig.enabled) {
          availableProviders.push({
            provider: providerKey,
            name: providerKey.charAt(0).toUpperCase() + providerKey.slice(1),
            enabled: true,
            clientId: providerConfig.clientId || null
          });
        }
      }

      res.status(200).json({
        success: true,
        data: {
          providers: availableProviders,
          count: availableProviders.length
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Private helper methods

  /**
   * Check if OAuth provider is enabled
   */
  private isProviderEnabled(provider: AuthProvider): boolean {
    switch (provider) {
      case AuthProvider.GOOGLE:
        return config.oauth.google.enabled;
      case AuthProvider.APPLE:
        return config.oauth.apple.enabled;
      case AuthProvider.FACEBOOK:
        return config.socialProviders.facebook;
      case AuthProvider.GITHUB:
        return config.socialProviders.github;
      default:
        return false;
    }
  }

  /**
   * Handle Google OAuth callback
   */
  private async handleGoogleCallback(req: Request, res: Response, code: string, state?: string): Promise<void> {
    try {
      // Exchange code for tokens
      // This would typically involve calling Google's token endpoint
      // For now, redirect to success with a placeholder
      
      logger.info('Google OAuth callback received', { code: code.substring(0, 10) + '...', state });
      
      // In a real implementation, you would:
      // 1. Exchange the authorization code for access and ID tokens
      // 2. Verify the ID token
      // 3. Create/login the user
      // 4. Redirect with success tokens or error
      
      res.redirect(`${config.oauth.successRedirect}?provider=google&state=${state || ''}`);
    } catch (error) {
      logger.error('Google OAuth callback error', error);
      res.redirect(`${config.oauth.errorRedirect}?error=google_callback_failed`);
    }
  }

  /**
   * Handle Apple OAuth callback
   */
  private async handleAppleCallback(req: Request, res: Response, code: string, state?: string): Promise<void> {
    try {
      // Exchange code for tokens
      // This would typically involve calling Apple's token endpoint
      
      logger.info('Apple OAuth callback received', { code: code.substring(0, 10) + '...', state });
      
      // In a real implementation, you would:
      // 1. Exchange the authorization code for access and ID tokens
      // 2. Verify the ID token
      // 3. Create/login the user
      // 4. Redirect with success tokens or error
      
      res.redirect(`${config.oauth.successRedirect}?provider=apple&state=${state || ''}`);
    } catch (error) {
      logger.error('Apple OAuth callback error', error);
      res.redirect(`${config.oauth.errorRedirect}?error=apple_callback_failed`);
    }
  }
}

export const oauthController = new OAuthController();
export default oauthController;