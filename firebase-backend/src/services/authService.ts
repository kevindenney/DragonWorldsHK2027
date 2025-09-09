import { Timestamp } from 'firebase-admin/firestore';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import firebaseConfig from '../config/firebase';
import { config } from '../config/environment';
import logger from '../utils/logger';
import {
  IUser,
  ICreateUser,
  ICreateOAuthUser,
  IUserAuthResponse,
  IUserResponse,
  IOAuthProviderData,
  ILinkedProvider,
  IOAuthLinkingRequest,
  IProviderProfile,
  UserRole,
  UserStatus,
  AuthProvider,
  USER_DEFAULTS,
  UserTransformers,
  OAuthProviderUtils
} from '../models/User';
import { CustomError } from '../middleware/errorHandler';

export class AuthService {
  private readonly usersCollection = 'users';
  private readonly sessionsCollection = 'sessions';

  /**
   * Register a new user with email and password
   */
  async register(userData: ICreateUser): Promise<IUserAuthResponse> {
    try {
      logger.info('Starting user registration', { email: userData.email });

      // Check if user already exists
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        throw new CustomError('User with this email already exists', 409);
      }

      // Create user in Firebase Auth
      const userRecord = await firebaseConfig.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
        phoneNumber: userData.phoneNumber,
        photoURL: userData.photoURL,
        emailVerified: false
      });

      // Create user document in Firestore
      const now = Timestamp.now();
      const newUser: IUser = {
        uid: userRecord.uid,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        phoneNumber: userData.phoneNumber,
        emailVerified: false,
        role: userData.role || USER_DEFAULTS.role,
        status: USER_DEFAULTS.status,
        providers: USER_DEFAULTS.providers,
        profile: {
          ...USER_DEFAULTS.profile,
          ...userData.profile
        },
        preferences: {
          ...USER_DEFAULTS.preferences,
          ...userData.preferences
        },
        metadata: {
          ...USER_DEFAULTS.metadata,
          createdAt: now,
          updatedAt: now
        },
        isDeleted: USER_DEFAULTS.isDeleted
      };

      // Save to Firestore
      await firebaseConfig.setDocument(this.usersCollection, userRecord.uid, 
        UserTransformers.toFirestore(newUser)
      );

      // Set custom claims
      await this.setUserClaims(userRecord.uid, newUser.role);

      // Generate tokens
      const customToken = await firebaseConfig.createCustomToken(userRecord.uid, {
        role: newUser.role,
        email: newUser.email
      });

      // Log registration
      logger.logAuth('User registered', userRecord.uid, userData.email, true);

      // Update login metadata
      await this.updateLoginMetadata(userRecord.uid, '0.0.0.0', 'Registration');

      return {
        user: UserTransformers.toPublicResponse(newUser),
        tokens: {
          accessToken: customToken,
          expiresIn: 3600 // 1 hour
        }
      };

    } catch (error) {
      logger.logAuth('Registration failed', undefined, userData.email, false);
      logger.logError(error as Error, { service: 'authService', method: 'register' });
      
      if (error instanceof CustomError) {
        throw error;
      }
      
      throw new CustomError('Registration failed', 500);
    }
  }

  /**
   * Login user with email and password
   */
  async login(email: string, password: string, ipAddress?: string, userAgent?: string): Promise<IUserAuthResponse> {
    try {
      logger.info('Starting user login', { email });

      // Get user from Firebase Auth
      const userRecord = await firebaseConfig.getUserByEmail(email);
      
      // Get user from Firestore
      const userDoc = await firebaseConfig.getDocument(this.usersCollection, userRecord.uid);
      
      if (!userDoc.exists) {
        throw new CustomError('User not found', 404);
      }

      const user = UserTransformers.fromFirestore(userDoc);

      // Check user status
      if (user.status !== UserStatus.ACTIVE) {
        throw new CustomError('Account is not active', 403);
      }

      // Generate custom token
      const customToken = await firebaseConfig.createCustomToken(userRecord.uid, {
        role: user.role,
        email: user.email
      });

      // Update login metadata
      await this.updateLoginMetadata(userRecord.uid, ipAddress, userAgent);

      // Log successful login
      logger.logAuth('User logged in', userRecord.uid, email, true);

      // Get updated user data
      const updatedUserDoc = await firebaseConfig.getDocument(this.usersCollection, userRecord.uid);
      const updatedUser = UserTransformers.fromFirestore(updatedUserDoc);

      return {
        user: UserTransformers.toPublicResponse(updatedUser),
        tokens: {
          accessToken: customToken,
          expiresIn: 3600 // 1 hour
        }
      };

    } catch (error) {
      logger.logAuth('Login failed', undefined, email, false);
      logger.logError(error as Error, { service: 'authService', method: 'login' });
      
      if (error instanceof CustomError) {
        throw error;
      }
      
      throw new CustomError('Login failed', 401);
    }
  }

  /**
   * Login with Firebase ID token (for client-side authentication)
   */
  async loginWithToken(idToken: string, ipAddress?: string, userAgent?: string): Promise<IUserAuthResponse> {
    try {
      logger.info('Starting token-based login');

      // Verify the ID token
      const decodedToken = await firebaseConfig.verifyIdToken(idToken);
      
      // Get user from Firestore
      const userDoc = await firebaseConfig.getDocument(this.usersCollection, decodedToken.uid);
      
      let user: IUser;
      
      if (!userDoc.exists) {
        // Create user document if it doesn't exist (for social login)
        user = await this.createUserFromToken(decodedToken);
      } else {
        user = UserTransformers.fromFirestore(userDoc);
        
        // Check user status
        if (user.status !== UserStatus.ACTIVE) {
          throw new CustomError('Account is not active', 403);
        }
      }

      // Update login metadata
      await this.updateLoginMetadata(decodedToken.uid, ipAddress, userAgent);

      // Log successful login
      logger.logAuth('Token login successful', decodedToken.uid, decodedToken.email, true);

      // Get updated user data
      const updatedUserDoc = await firebaseConfig.getDocument(this.usersCollection, decodedToken.uid);
      const updatedUser = UserTransformers.fromFirestore(updatedUserDoc);

      return {
        user: UserTransformers.toPublicResponse(updatedUser),
        tokens: {
          accessToken: idToken,
          expiresIn: 3600 // 1 hour
        }
      };

    } catch (error) {
      logger.logAuth('Token login failed', undefined, undefined, false);
      logger.logError(error as Error, { service: 'authService', method: 'loginWithToken' });
      
      if (error instanceof CustomError) {
        throw error;
      }
      
      throw new CustomError('Token authentication failed', 401);
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string): Promise<void> {
    try {
      // Revoke user's refresh tokens
      await firebaseConfig.auth.revokeRefreshTokens(userId);
      
      // Update last activity
      await firebaseConfig.updateDocument(this.usersCollection, userId, {
        'metadata.lastActiveAt': Timestamp.now()
      });

      logger.logAuth('User logged out', userId, undefined, true);

    } catch (error) {
      logger.logError(error as Error, { service: 'authService', method: 'logout' });
      throw new CustomError('Logout failed', 500);
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<void> {
    try {
      // Generate password reset link (this would typically send an email)
      const link = await firebaseConfig.auth.generatePasswordResetLink(email);
      
      logger.logAuth('Password reset requested', undefined, email, true);
      
      // In a real application, you would send this link via email
      // For now, we'll just log it (don't do this in production)
      if (config.nodeEnv === 'development') {
        logger.info('Password reset link (dev only):', { email, link });
      }

    } catch (error) {
      logger.logError(error as Error, { service: 'authService', method: 'resetPassword' });
      
      if ((error as any).code === 'auth/user-not-found') {
        // Don't reveal whether user exists or not
        return;
      }
      
      throw new CustomError('Password reset failed', 500);
    }
  }

  /**
   * Change password
   */
  async changePassword(userId: string, newPassword: string): Promise<void> {
    try {
      await firebaseConfig.updateUser(userId, {
        password: newPassword
      });

      // Update metadata
      await firebaseConfig.updateDocument(this.usersCollection, userId, {
        'metadata.updatedAt': Timestamp.now()
      });

      logger.logAuth('Password changed', userId, undefined, true);

    } catch (error) {
      logger.logError(error as Error, { service: 'authService', method: 'changePassword' });
      throw new CustomError('Password change failed', 500);
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(userId: string): Promise<void> {
    try {
      await firebaseConfig.updateUser(userId, {
        emailVerified: true
      });

      // Update user document
      await firebaseConfig.updateDocument(this.usersCollection, userId, {
        emailVerified: true,
        'metadata.updatedAt': Timestamp.now()
      });

      logger.logAuth('Email verified', userId, undefined, true);

    } catch (error) {
      logger.logError(error as Error, { service: 'authService', method: 'verifyEmail' });
      throw new CustomError('Email verification failed', 500);
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(userId: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      // Get user data for custom claims
      const userDoc = await firebaseConfig.getDocument(this.usersCollection, userId);
      
      if (!userDoc.exists) {
        throw new CustomError('User not found', 404);
      }

      const user = UserTransformers.fromFirestore(userDoc);

      // Generate new custom token
      const customToken = await firebaseConfig.createCustomToken(userId, {
        role: user.role,
        email: user.email
      });

      return {
        accessToken: customToken,
        expiresIn: 3600
      };

    } catch (error) {
      logger.logError(error as Error, { service: 'authService', method: 'refreshToken' });
      throw new CustomError('Token refresh failed', 401);
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(userId: string): Promise<void> {
    try {
      // Soft delete in Firestore
      await firebaseConfig.updateDocument(this.usersCollection, userId, {
        isDeleted: true,
        status: UserStatus.INACTIVE,
        'metadata.updatedAt': Timestamp.now()
      });

      // Delete from Firebase Auth
      await firebaseConfig.deleteUser(userId);

      logger.logAuth('Account deleted', userId, undefined, true);

    } catch (error) {
      logger.logError(error as Error, { service: 'authService', method: 'deleteAccount' });
      throw new CustomError('Account deletion failed', 500);
    }
  }

  // Private helper methods

  private async getUserByEmail(email: string): Promise<IUser | null> {
    try {
      const querySnapshot = await firebaseConfig.firestore
        .collection(this.usersCollection)
        .where('email', '==', email.toLowerCase())
        .where('isDeleted', '==', false)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return null;
      }

      return UserTransformers.fromFirestore(querySnapshot.docs[0]);
    } catch (error) {
      logger.logError(error as Error, { service: 'authService', method: 'getUserByEmail' });
      return null;
    }
  }

  private async setUserClaims(userId: string, role: UserRole): Promise<void> {
    const customClaims = {
      role,
      permissions: this.getRolePermissions(role)
    };

    await firebaseConfig.setCustomUserClaims(userId, customClaims);
    
    // Also store in user document
    await firebaseConfig.updateDocument(this.usersCollection, userId, {
      customClaims,
      'metadata.updatedAt': Timestamp.now()
    });
  }

  private getRolePermissions(role: UserRole): string[] {
    const permissions = {
      [UserRole.USER]: ['user:read:own', 'user:update:own'],
      [UserRole.ADMIN]: ['user:read:own', 'user:update:own', 'user:read:any', 'user:update:any', 'admin:read'],
      [UserRole.SUPER_ADMIN]: ['*']
    };

    return permissions[role] || permissions[UserRole.USER];
  }

  private async updateLoginMetadata(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      const updateData: any = {
        'metadata.lastLoginAt': Timestamp.now(),
        'metadata.lastActiveAt': Timestamp.now(),
        'metadata.updatedAt': Timestamp.now()
      };

      if (ipAddress) {
        updateData['metadata.ipAddress'] = ipAddress;
      }

      if (userAgent) {
        updateData['metadata.userAgent'] = userAgent;
      }

      // Increment login count
      const userDoc = await firebaseConfig.getDocument(this.usersCollection, userId);
      if (userDoc.exists) {
        const userData = userDoc.data();
        updateData['metadata.loginCount'] = (userData.metadata?.loginCount || 0) + 1;
      }

      await firebaseConfig.updateDocument(this.usersCollection, userId, updateData);

    } catch (error) {
      logger.logError(error as Error, { service: 'authService', method: 'updateLoginMetadata' });
    }
  }

  private async createUserFromToken(decodedToken: any): Promise<IUser> {
    const now = Timestamp.now();
    
    // Determine auth provider
    const provider = this.getAuthProvider(decodedToken.firebase?.sign_in_provider);
    
    // Extract user info using OAuth utils
    const userInfo = OAuthProviderUtils.extractUserInfo(provider, decodedToken);
    
    // Create OAuth provider data
    const oauthData: IOAuthProviderData = {
      providerId: provider,
      uid: userInfo.uid,
      email: userInfo.email,
      displayName: userInfo.displayName,
      photoURL: userInfo.photoURL,
      linkedAt: now,
      lastUsed: now,
      metadata: {
        verified_email: userInfo.emailVerified,
        ...decodedToken
      }
    };

    // Create linked provider
    const linkedProvider = UserTransformers.oauthToLinkedProvider(provider, oauthData, true);
    
    // Create provider profile
    const providerProfile = UserTransformers.createProviderProfile(provider, decodedToken);
    
    const newUser: IUser = {
      uid: decodedToken.uid,
      email: userInfo.email,
      displayName: userInfo.displayName,
      photoURL: userInfo.photoURL,
      phoneNumber: decodedToken.phone_number,
      emailVerified: userInfo.emailVerified,
      role: USER_DEFAULTS.role,
      status: USER_DEFAULTS.status,
      providers: [provider],
      linkedProviders: [linkedProvider],
      providerProfiles: providerProfile,
      primaryProvider: provider,
      profile: USER_DEFAULTS.profile,
      preferences: USER_DEFAULTS.preferences,
      metadata: {
        ...USER_DEFAULTS.metadata,
        createdAt: now,
        updatedAt: now
      },
      isDeleted: USER_DEFAULTS.isDeleted
    };

    // Save to Firestore
    await firebaseConfig.setDocument(this.usersCollection, decodedToken.uid, 
      UserTransformers.toFirestore(newUser)
    );

    // Set custom claims
    await this.setUserClaims(decodedToken.uid, newUser.role);

    logger.logAuth('User created from token', decodedToken.uid, decodedToken.email, true);

    return newUser;
  }

  private getAuthProvider(signInProvider?: string): AuthProvider {
    switch (signInProvider) {
      case 'google.com':
        return AuthProvider.GOOGLE;
      case 'facebook.com':
        return AuthProvider.FACEBOOK;
      case 'apple.com':
        return AuthProvider.APPLE;
      case 'github.com':
        return AuthProvider.GITHUB;
      default:
        return AuthProvider.EMAIL;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;