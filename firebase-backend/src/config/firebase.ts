import * as admin from 'firebase-admin';
import { config } from './environment';
import logger from '../utils/logger';

class FirebaseConfig {
  private static instance: FirebaseConfig;
  private _admin: admin.app.App;

  private constructor() {
    this.initializeFirebase();
  }

  public static getInstance(): FirebaseConfig {
    if (!FirebaseConfig.instance) {
      FirebaseConfig.instance = new FirebaseConfig();
    }
    return FirebaseConfig.instance;
  }

  private initializeFirebase(): void {
    try {
      // Initialize Firebase Admin SDK
      if (admin.apps.length === 0) {
        const serviceAccount = this.getServiceAccountConfig();
        
        this._admin = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: config.firebase.databaseUrl,
          projectId: config.firebase.projectId,
          storageBucket: `${config.firebase.projectId}.appspot.com`
        });

        logger.info('Firebase Admin SDK initialized successfully');
      } else {
        this._admin = admin.apps[0] as admin.app.App;
        logger.info('Firebase Admin SDK already initialized');
      }
    } catch (error) {
      logger.error('Failed to initialize Firebase Admin SDK:', error);
      throw new Error('Firebase initialization failed');
    }
  }

  private getServiceAccountConfig(): admin.ServiceAccount {
    if (config.nodeEnv === 'development' || config.nodeEnv === 'test') {
      // For development, use environment variables
      return {
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey.replace(/\\n/g, '\n')
      };
    } else {
      // For production, use service account key file
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        return require('./serviceAccountKey.json');
      } catch (error) {
        logger.error('Service account key file not found, falling back to environment variables');
        return {
          projectId: config.firebase.projectId,
          clientEmail: config.firebase.clientEmail,
          privateKey: config.firebase.privateKey.replace(/\\n/g, '\n')
        };
      }
    }
  }

  public get admin(): admin.app.App {
    return this._admin;
  }

  public get auth(): admin.auth.Auth {
    return this._admin.auth();
  }

  public get firestore(): admin.firestore.Firestore {
    return this._admin.firestore();
  }

  public get storage(): admin.storage.Storage {
    return this._admin.storage();
  }

  public async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      return await this.auth.verifyIdToken(idToken);
    } catch (error) {
      logger.error('Token verification failed:', error);
      throw new Error('Invalid token');
    }
  }

  public async createCustomToken(uid: string, additionalClaims?: object): Promise<string> {
    try {
      return await this.auth.createCustomToken(uid, additionalClaims);
    } catch (error) {
      logger.error('Custom token creation failed:', error);
      throw new Error('Token creation failed');
    }
  }

  public async setCustomUserClaims(uid: string, customClaims: object): Promise<void> {
    try {
      await this.auth.setCustomUserClaims(uid, customClaims);
      logger.info(`Custom claims set for user ${uid}`);
    } catch (error) {
      logger.error('Setting custom claims failed:', error);
      throw new Error('Failed to set custom claims');
    }
  }

  public async getUserByEmail(email: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.auth.getUserByEmail(email);
    } catch (error) {
      logger.error('Get user by email failed:', error);
      throw new Error('User not found');
    }
  }

  public async createUser(userRecord: admin.auth.CreateRequest): Promise<admin.auth.UserRecord> {
    try {
      const user = await this.auth.createUser(userRecord);
      logger.info(`User created: ${user.uid}`);
      return user;
    } catch (error) {
      logger.error('User creation failed:', error);
      throw new Error('User creation failed');
    }
  }

  public async updateUser(uid: string, userRecord: admin.auth.UpdateRequest): Promise<admin.auth.UserRecord> {
    try {
      const user = await this.auth.updateUser(uid, userRecord);
      logger.info(`User updated: ${uid}`);
      return user;
    } catch (error) {
      logger.error('User update failed:', error);
      throw new Error('User update failed');
    }
  }

  public async deleteUser(uid: string): Promise<void> {
    try {
      await this.auth.deleteUser(uid);
      logger.info(`User deleted: ${uid}`);
    } catch (error) {
      logger.error('User deletion failed:', error);
      throw new Error('User deletion failed');
    }
  }

  public async listUsers(maxResults?: number, pageToken?: string): Promise<admin.auth.ListUsersResult> {
    try {
      return await this.auth.listUsers(maxResults, pageToken);
    } catch (error) {
      logger.error('List users failed:', error);
      throw new Error('Failed to list users');
    }
  }

  // Firestore helper methods
  public async getDocument(collection: string, docId: string): Promise<admin.firestore.DocumentSnapshot> {
    try {
      return await this.firestore.collection(collection).doc(docId).get();
    } catch (error) {
      logger.error('Get document failed:', error);
      throw new Error('Document retrieval failed');
    }
  }

  public async setDocument(collection: string, docId: string, data: any): Promise<void> {
    try {
      await this.firestore.collection(collection).doc(docId).set(data, { merge: true });
      logger.info(`Document set: ${collection}/${docId}`);
    } catch (error) {
      logger.error('Set document failed:', error);
      throw new Error('Document creation failed');
    }
  }

  public async updateDocument(collection: string, docId: string, data: any): Promise<void> {
    try {
      await this.firestore.collection(collection).doc(docId).update(data);
      logger.info(`Document updated: ${collection}/${docId}`);
    } catch (error) {
      logger.error('Update document failed:', error);
      throw new Error('Document update failed');
    }
  }

  public async deleteDocument(collection: string, docId: string): Promise<void> {
    try {
      await this.firestore.collection(collection).doc(docId).delete();
      logger.info(`Document deleted: ${collection}/${docId}`);
    } catch (error) {
      logger.error('Delete document failed:', error);
      throw new Error('Document deletion failed');
    }
  }

  public getCollection(collectionPath: string): admin.firestore.CollectionReference {
    return this.firestore.collection(collectionPath);
  }

  public batch(): admin.firestore.WriteBatch {
    return this.firestore.batch();
  }

  // OAuth provider management methods

  /**
   * Verify Google ID token
   */
  public async verifyGoogleIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      // Verify the token came from Google and is valid
      const decodedToken = await this.auth.verifyIdToken(idToken);
      
      if (decodedToken.firebase?.sign_in_provider !== 'google.com') {
        throw new Error('Token is not from Google provider');
      }
      
      logger.info('Google token verified successfully', { uid: decodedToken.uid });
      return decodedToken;
    } catch (error) {
      logger.error('Google token verification failed:', error);
      throw new Error('Invalid Google token');
    }
  }

  /**
   * Verify Apple ID token
   */
  public async verifyAppleIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      // Verify the token came from Apple and is valid
      const decodedToken = await this.auth.verifyIdToken(idToken);
      
      if (decodedToken.firebase?.sign_in_provider !== 'apple.com') {
        throw new Error('Token is not from Apple provider');
      }
      
      logger.info('Apple token verified successfully', { uid: decodedToken.uid });
      return decodedToken;
    } catch (error) {
      logger.error('Apple token verification failed:', error);
      throw new Error('Invalid Apple token');
    }
  }

  /**
   * Link OAuth provider to existing user
   */
  public async linkOAuthProvider(
    uid: string, 
    provider: string, 
    providerData: any
  ): Promise<admin.auth.UserRecord> {
    try {
      const updateData: admin.auth.UpdateRequest = {
        providerToLink: {
          providerId: provider,
          uid: providerData.uid,
          email: providerData.email,
          displayName: providerData.displayName,
          photoURL: providerData.photoURL
        }
      };

      const updatedUser = await this.auth.updateUser(uid, updateData);
      
      logger.info(`Provider ${provider} linked to user ${uid}`);
      return updatedUser;
    } catch (error) {
      logger.error(`Failed to link provider ${provider} to user ${uid}:`, error);
      throw new Error(`Failed to link ${provider} provider`);
    }
  }

  /**
   * Unlink OAuth provider from user
   */
  public async unlinkOAuthProvider(uid: string, provider: string): Promise<admin.auth.UserRecord> {
    try {
      const user = await this.auth.getUser(uid);
      
      // Check if user has the provider linked
      const hasProvider = user.providerData.some(p => p.providerId === provider);
      if (!hasProvider) {
        throw new Error(`Provider ${provider} is not linked to this user`);
      }

      // Check if user will still have at least one authentication method
      const remainingProviders = user.providerData.filter(p => p.providerId !== provider);
      const hasPassword = user.passwordHash && user.passwordHash.length > 0;
      
      if (remainingProviders.length === 0 && !hasPassword) {
        throw new Error('Cannot unlink last authentication provider. User must have at least one way to sign in.');
      }

      const updateData: admin.auth.UpdateRequest = {
        providersToUnlink: [provider]
      };

      const updatedUser = await this.auth.updateUser(uid, updateData);
      
      logger.info(`Provider ${provider} unlinked from user ${uid}`);
      return updatedUser;
    } catch (error) {
      logger.error(`Failed to unlink provider ${provider} from user ${uid}:`, error);
      throw new Error(`Failed to unlink ${provider} provider`);
    }
  }

  /**
   * Get user's linked providers
   */
  public async getUserProviders(uid: string): Promise<{
    providers: admin.auth.UserInfo[];
    hasPassword: boolean;
    canUnlinkProviders: boolean;
  }> {
    try {
      const user = await this.auth.getUser(uid);
      const hasPassword = user.passwordHash && user.passwordHash.length > 0;
      const canUnlinkProviders = user.providerData.length > 1 || hasPassword;

      return {
        providers: user.providerData,
        hasPassword,
        canUnlinkProviders
      };
    } catch (error) {
      logger.error(`Failed to get user providers for ${uid}:`, error);
      throw new Error('Failed to get user providers');
    }
  }

  /**
   * Import user from OAuth provider
   */
  public async importOAuthUser(
    providerData: {
      provider: string;
      uid: string;
      email?: string;
      displayName?: string;
      photoURL?: string;
      emailVerified?: boolean;
    }
  ): Promise<admin.auth.UserRecord> {
    try {
      const userRecord = await this.auth.importUsers([{
        uid: providerData.uid,
        email: providerData.email,
        displayName: providerData.displayName,
        photoURL: providerData.photoURL,
        emailVerified: providerData.emailVerified || false,
        providerData: [{
          uid: providerData.uid,
          providerId: providerData.provider,
          email: providerData.email,
          displayName: providerData.displayName,
          photoURL: providerData.photoURL
        }]
      }]);

      logger.info(`OAuth user imported: ${providerData.uid} from ${providerData.provider}`);
      return userRecord.results[0].user!;
    } catch (error) {
      logger.error('OAuth user import failed:', error);
      throw new Error('Failed to import OAuth user');
    }
  }

  /**
   * Find user by OAuth provider data
   */
  public async findUserByProvider(
    provider: string, 
    providerUid: string
  ): Promise<admin.auth.UserRecord | null> {
    try {
      // Search for user with this provider
      const listUsersResult = await this.auth.listUsers(1000);
      
      for (const user of listUsersResult.users) {
        const hasProvider = user.providerData.some(
          p => p.providerId === provider && p.uid === providerUid
        );
        if (hasProvider) {
          return user;
        }
      }

      return null;
    } catch (error) {
      logger.error(`Failed to find user by provider ${provider}:`, error);
      return null;
    }
  }

  /**
   * Merge OAuth account data into existing user document
   */
  public async mergeOAuthAccountData(
    uid: string,
    provider: string,
    oauthData: any
  ): Promise<void> {
    try {
      const updateData = {
        [`providers.${provider}`]: {
          uid: oauthData.uid,
          email: oauthData.email,
          displayName: oauthData.displayName,
          photoURL: oauthData.photoURL,
          linkedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastUsed: admin.firestore.FieldValue.serverTimestamp()
        },
        'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp()
      };

      await this.updateDocument('users', uid, updateData);
      
      logger.info(`OAuth data merged for user ${uid} provider ${provider}`);
    } catch (error) {
      logger.error(`Failed to merge OAuth data for user ${uid}:`, error);
      throw new Error('Failed to merge OAuth account data');
    }
  }
}

// Export singleton instance
export const firebaseConfig = FirebaseConfig.getInstance();
export default firebaseConfig;