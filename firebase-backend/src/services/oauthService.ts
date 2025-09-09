import { Timestamp } from 'firebase-admin/firestore';
import firebaseConfig from '../config/firebase';
import logger from '../utils/logger';
import {
  IUser,
  IUserAuthResponse,
  IUserResponse,
  IOAuthProviderData,
  ILinkedProvider,
  IOAuthLinkingRequest,
  ICreateOAuthUser,
  UserRole,
  UserStatus,
  AuthProvider,
  USER_DEFAULTS,
  UserTransformers,
  OAuthProviderUtils
} from '../models/User';
import { CustomError } from '../middleware/errorHandler';

/**
 * OAuth Service for handling OAuth-specific authentication operations
 */
export class OAuthService {
  private readonly usersCollection = 'users';

  /**
   * Login with Google OAuth
   */
  async loginWithGoogle(idToken: string, ipAddress?: string, userAgent?: string): Promise<IUserAuthResponse> {
    try {
      logger.info('Starting Google OAuth login');

      // Verify Google ID token
      const decodedToken = await firebaseConfig.verifyGoogleIdToken(idToken);
      
      return await this.handleOAuthLogin(AuthProvider.GOOGLE, decodedToken, ipAddress, userAgent);
      
    } catch (error) {
      logger.logAuth('Google login failed', undefined, undefined, false);
      logger.logError(error as Error, { service: 'oauthService', method: 'loginWithGoogle' });
      throw new CustomError('Google authentication failed', 401);
    }
  }

  /**
   * Login with Apple OAuth
   */
  async loginWithApple(idToken: string, ipAddress?: string, userAgent?: string): Promise<IUserAuthResponse> {
    try {
      logger.info('Starting Apple OAuth login');

      // Verify Apple ID token
      const decodedToken = await firebaseConfig.verifyAppleIdToken(idToken);
      
      return await this.handleOAuthLogin(AuthProvider.APPLE, decodedToken, ipAddress, userAgent);
      
    } catch (error) {
      logger.logAuth('Apple login failed', undefined, undefined, false);
      logger.logError(error as Error, { service: 'oauthService', method: 'loginWithApple' });
      throw new CustomError('Apple authentication failed', 401);
    }
  }

  /**
   * Create user from OAuth provider
   */
  async createOAuthUser(userData: ICreateOAuthUser): Promise<IUserAuthResponse> {
    try {
      logger.info('Creating OAuth user', { provider: userData.provider });

      // Extract user info using OAuth utils
      const userInfo = OAuthProviderUtils.extractUserInfo(userData.provider, userData.providerData);
      
      // Check if user already exists by email
      if (userInfo.email) {
        const existingUser = await this.getUserByEmail(userInfo.email);
        if (existingUser) {
          throw new CustomError('User with this email already exists', 409);
        }
      }

      const now = Timestamp.now();
      
      // Create OAuth provider data
      const oauthData: IOAuthProviderData = {
        providerId: userData.provider,
        uid: userInfo.uid,
        email: userInfo.email,
        displayName: userInfo.displayName,
        photoURL: userInfo.photoURL,
        accessToken: userData.accessToken,
        refreshToken: userData.refreshToken,
        idToken: userData.idToken,
        linkedAt: now,
        lastUsed: now,
        metadata: {
          verified_email: userInfo.emailVerified,
          ...userData.providerData
        }
      };

      // Create user in Firebase Auth if not exists
      let firebaseUser;
      try {
        firebaseUser = await firebaseConfig.auth.getUser(userInfo.uid);
      } catch {
        // Create user in Firebase Auth
        firebaseUser = await firebaseConfig.createUser({
          uid: userInfo.uid,
          email: userInfo.email,
          displayName: userInfo.displayName,
          photoURL: userInfo.photoURL,
          emailVerified: userInfo.emailVerified
        });
      }

      // Create linked provider
      const linkedProvider = UserTransformers.oauthToLinkedProvider(userData.provider, oauthData, true);
      
      // Create provider profile
      const providerProfile = UserTransformers.createProviderProfile(userData.provider, userData.providerData);
      
      // Create user document
      const newUser: IUser = {
        uid: firebaseUser.uid,
        email: userInfo.email,
        displayName: userInfo.displayName,
        photoURL: userInfo.photoURL,
        emailVerified: userInfo.emailVerified,
        role: userData.role || USER_DEFAULTS.role,
        status: USER_DEFAULTS.status,
        providers: [userData.provider],
        linkedProviders: [linkedProvider],
        providerProfiles: providerProfile,
        primaryProvider: userData.provider,
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
      await firebaseConfig.setDocument(this.usersCollection, firebaseUser.uid, 
        UserTransformers.toFirestore(newUser)
      );

      // Set custom claims
      await this.setUserClaims(firebaseUser.uid, newUser.role);

      // Generate tokens
      const customToken = await firebaseConfig.createCustomToken(firebaseUser.uid, {
        role: newUser.role,
        email: newUser.email
      });

      // Update login metadata
      await this.updateLoginMetadata(firebaseUser.uid, '0.0.0.0', 'OAuth Registration');

      logger.logAuth('OAuth user created', firebaseUser.uid, userInfo.email, true);

      return {
        user: UserTransformers.toPublicResponse(newUser),
        tokens: {
          accessToken: customToken,
          expiresIn: 3600
        }
      };

    } catch (error) {
      logger.logError(error as Error, { service: 'oauthService', method: 'createOAuthUser' });
      
      if (error instanceof CustomError) {
        throw error;
      }
      
      throw new CustomError('OAuth user creation failed', 500);
    }
  }

  /**
   * Link OAuth provider to existing user
   */
  async linkOAuthProvider(request: IOAuthLinkingRequest): Promise<IUserResponse> {
    try {
      logger.info('Linking OAuth provider', { userId: request.userId, provider: request.provider });

      // Get current user
      const userDoc = await firebaseConfig.getDocument(this.usersCollection, request.userId);
      if (!userDoc.exists) {
        throw new CustomError('User not found', 404);
      }

      const user = UserTransformers.fromFirestore(userDoc);

      // Check if provider is already linked
      if (OAuthProviderUtils.isProviderLinked(user, request.provider)) {
        throw new CustomError('Provider already linked to this account', 409);
      }

      // Verify the token based on provider
      let decodedToken;
      switch (request.provider) {
        case AuthProvider.GOOGLE:
          decodedToken = await firebaseConfig.verifyGoogleIdToken(request.idToken);
          break;
        case AuthProvider.APPLE:
          decodedToken = await firebaseConfig.verifyAppleIdToken(request.idToken);
          break;
        default:
          decodedToken = await firebaseConfig.verifyIdToken(request.idToken);
      }

      // Extract user info
      const userInfo = OAuthProviderUtils.extractUserInfo(request.provider, decodedToken);
      
      // Check if this OAuth account is already linked to another user
      const existingUser = await firebaseConfig.findUserByProvider(request.provider, userInfo.uid);
      if (existingUser && existingUser.uid !== request.userId) {
        if (request.linkExistingAccount) {
          // Merge accounts logic would go here
          throw new CustomError('Account merging not yet implemented', 501);
        } else {
          throw new CustomError('This account is already linked to another user', 409);
        }
      }

      const now = Timestamp.now();
      
      // Create OAuth provider data
      const oauthData: IOAuthProviderData = {
        providerId: request.provider,
        uid: userInfo.uid,
        email: userInfo.email,
        displayName: userInfo.displayName,
        photoURL: userInfo.photoURL,
        accessToken: request.accessToken,
        refreshToken: request.refreshToken,
        idToken: request.idToken,
        linkedAt: now,
        lastUsed: now,
        metadata: {
          verified_email: userInfo.emailVerified,
          ...decodedToken
        }
      };

      // Create linked provider
      const linkedProvider = UserTransformers.oauthToLinkedProvider(request.provider, oauthData, false);
      
      // Create provider profile
      const providerProfile = UserTransformers.createProviderProfile(request.provider, decodedToken);

      // Update user document
      const updatedProviders = [...user.providers, request.provider];
      const updatedLinkedProviders = [...user.linkedProviders, linkedProvider];
      const updatedProviderProfiles = { ...user.providerProfiles, ...providerProfile };

      const updateData = {
        providers: updatedProviders,
        linkedProviders: updatedLinkedProviders,
        providerProfiles: updatedProviderProfiles,
        'metadata.updatedAt': now
      };

      await firebaseConfig.updateDocument(this.usersCollection, request.userId, updateData);

      // Link provider in Firebase Auth
      await firebaseConfig.linkOAuthProvider(request.userId, request.provider, userInfo);

      // Get updated user
      const updatedUserDoc = await firebaseConfig.getDocument(this.usersCollection, request.userId);
      const updatedUser = UserTransformers.fromFirestore(updatedUserDoc);

      logger.logAuth('OAuth provider linked', request.userId, userInfo.email, true);

      return UserTransformers.toPublicResponse(updatedUser);

    } catch (error) {
      logger.logError(error as Error, { service: 'oauthService', method: 'linkOAuthProvider' });
      
      if (error instanceof CustomError) {
        throw error;
      }
      
      throw new CustomError('Failed to link OAuth provider', 500);
    }
  }

  /**
   * Unlink OAuth provider from user
   */
  async unlinkOAuthProvider(userId: string, provider: AuthProvider): Promise<IUserResponse> {
    try {
      logger.info('Unlinking OAuth provider', { userId, provider });

      // Get current user
      const userDoc = await firebaseConfig.getDocument(this.usersCollection, userId);
      if (!userDoc.exists) {
        throw new CustomError('User not found', 404);
      }

      const user = UserTransformers.fromFirestore(userDoc);

      // Check if provider is linked
      if (!OAuthProviderUtils.isProviderLinked(user, provider)) {
        throw new CustomError('Provider is not linked to this account', 404);
      }

      // Check if provider can be unlinked
      if (!OAuthProviderUtils.canUnlinkProvider(user, provider)) {
        throw new CustomError('Cannot unlink last authentication provider', 400);
      }

      // Update user document
      const updatedProviders = user.providers.filter(p => p !== provider);
      const updatedLinkedProviders = OAuthProviderUtils.removeProvider(user.linkedProviders, provider);
      const updatedProviderProfiles = { ...user.providerProfiles };
      delete updatedProviderProfiles[provider];

      // Update primary provider if needed
      let primaryProvider = user.primaryProvider;
      if (primaryProvider === provider) {
        primaryProvider = updatedProviders.includes(AuthProvider.EMAIL) 
          ? AuthProvider.EMAIL 
          : updatedProviders[0] || AuthProvider.EMAIL;
      }

      const updateData = {
        providers: updatedProviders,
        linkedProviders: updatedLinkedProviders,
        providerProfiles: updatedProviderProfiles,
        primaryProvider,
        'metadata.updatedAt': Timestamp.now()
      };

      await firebaseConfig.updateDocument(this.usersCollection, userId, updateData);

      // Unlink provider in Firebase Auth
      await firebaseConfig.unlinkOAuthProvider(userId, provider);

      // Get updated user
      const updatedUserDoc = await firebaseConfig.getDocument(this.usersCollection, userId);
      const updatedUser = UserTransformers.fromFirestore(updatedUserDoc);

      logger.logAuth('OAuth provider unlinked', userId, undefined, true);

      return UserTransformers.toPublicResponse(updatedUser);

    } catch (error) {
      logger.logError(error as Error, { service: 'oauthService', method: 'unlinkOAuthProvider' });
      
      if (error instanceof CustomError) {
        throw error;
      }
      
      throw new CustomError('Failed to unlink OAuth provider', 500);
    }
  }

  /**
   * Get user's linked OAuth providers
   */
  async getUserProviders(userId: string): Promise<{
    providers: ILinkedProvider[];
    hasPassword: boolean;
    canUnlinkProviders: boolean;
  }> {
    try {
      const userDoc = await firebaseConfig.getDocument(this.usersCollection, userId);
      if (!userDoc.exists) {
        throw new CustomError('User not found', 404);
      }

      const user = UserTransformers.fromFirestore(userDoc);
      const hasPassword = user.providers.includes(AuthProvider.EMAIL);
      const canUnlinkProviders = user.linkedProviders.length > 1 || hasPassword;

      return {
        providers: user.linkedProviders,
        hasPassword,
        canUnlinkProviders
      };

    } catch (error) {
      logger.logError(error as Error, { service: 'oauthService', method: 'getUserProviders' });
      
      if (error instanceof CustomError) {
        throw error;
      }
      
      throw new CustomError('Failed to get user providers', 500);
    }
  }

  /**
   * Set primary OAuth provider
   */
  async setPrimaryProvider(userId: string, provider: AuthProvider): Promise<IUserResponse> {
    try {
      logger.info('Setting primary provider', { userId, provider });

      const userDoc = await firebaseConfig.getDocument(this.usersCollection, userId);
      if (!userDoc.exists) {
        throw new CustomError('User not found', 404);
      }

      const user = UserTransformers.fromFirestore(userDoc);

      // Check if provider is linked
      if (!user.providers.includes(provider)) {
        throw new CustomError('Provider is not linked to this account', 400);
      }

      // Update linked providers
      const updatedLinkedProviders = OAuthProviderUtils.setPrimaryProvider(user.linkedProviders, provider);

      const updateData = {
        primaryProvider: provider,
        linkedProviders: updatedLinkedProviders,
        'metadata.updatedAt': Timestamp.now()
      };

      await firebaseConfig.updateDocument(this.usersCollection, userId, updateData);

      // Get updated user
      const updatedUserDoc = await firebaseConfig.getDocument(this.usersCollection, userId);
      const updatedUser = UserTransformers.fromFirestore(updatedUserDoc);

      logger.info('Primary provider updated', { userId, provider });

      return UserTransformers.toPublicResponse(updatedUser);

    } catch (error) {
      logger.logError(error as Error, { service: 'oauthService', method: 'setPrimaryProvider' });
      
      if (error instanceof CustomError) {
        throw error;
      }
      
      throw new CustomError('Failed to set primary provider', 500);
    }
  }

  // Private helper methods

  /**
   * Handle OAuth login flow
   */
  private async handleOAuthLogin(
    provider: AuthProvider, 
    decodedToken: any, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<IUserAuthResponse> {
    // Get user from Firestore
    let userDoc = await firebaseConfig.getDocument(this.usersCollection, decodedToken.uid);
    let user: IUser;
    
    if (!userDoc.exists) {
      // Create user document if it doesn't exist
      user = await this.createUserFromToken(decodedToken, provider);
    } else {
      user = UserTransformers.fromFirestore(userDoc);
      
      // Check user status
      if (user.status !== UserStatus.ACTIVE) {
        throw new CustomError('Account is not active', 403);
      }

      // Update provider last used timestamp
      const updatedLinkedProviders = OAuthProviderUtils.updateProviderLastUsed(user.linkedProviders, provider);
      
      await firebaseConfig.updateDocument(this.usersCollection, decodedToken.uid, {
        linkedProviders: updatedLinkedProviders,
        'metadata.updatedAt': Timestamp.now()
      });
    }

    // Update login metadata
    await this.updateLoginMetadata(decodedToken.uid, ipAddress, userAgent);

    // Log successful login
    logger.logAuth(`${provider} login successful`, decodedToken.uid, decodedToken.email, true);

    // Generate custom token
    const customToken = await firebaseConfig.createCustomToken(decodedToken.uid, {
      role: user.role,
      email: user.email
    });

    // Get updated user data
    const updatedUserDoc = await firebaseConfig.getDocument(this.usersCollection, decodedToken.uid);
    const updatedUser = UserTransformers.fromFirestore(updatedUserDoc);

    return {
      user: UserTransformers.toPublicResponse(updatedUser),
      tokens: {
        accessToken: customToken,
        expiresIn: 3600
      }
    };
  }

  /**
   * Create user from decoded token
   */
  private async createUserFromToken(decodedToken: any, provider: AuthProvider): Promise<IUser> {
    const now = Timestamp.now();
    
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

  /**
   * Get user by email
   */
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
      logger.logError(error as Error, { service: 'oauthService', method: 'getUserByEmail' });
      return null;
    }
  }

  /**
   * Set user custom claims
   */
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

  /**
   * Get role permissions
   */
  private getRolePermissions(role: UserRole): string[] {
    const permissions = {
      [UserRole.USER]: ['user:read:own', 'user:update:own'],
      [UserRole.ADMIN]: ['user:read:own', 'user:update:own', 'user:read:any', 'user:update:any', 'admin:read'],
      [UserRole.SUPER_ADMIN]: ['*']
    };

    return permissions[role] || permissions[UserRole.USER];
  }

  /**
   * Update login metadata
   */
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
      logger.logError(error as Error, { service: 'oauthService', method: 'updateLoginMetadata' });
    }
  }
}

// Export singleton instance
export const oauthService = new OAuthService();
export default oauthService;