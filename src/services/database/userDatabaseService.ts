import { Unsubscribe } from 'firebase/firestore';
import { firestoreService, FirestoreServiceError, QueryOptions, PaginatedResult } from './firestoreService';
import {
  CollectionName,
  FirestoreUser,
  UserSession,
  UserActivity,
  UserNotification,
  WeatherPreferences,
  CreateUserProfile,
  UpdateUserProfile,
  UpdatePreferences,
  UpdateProfileInfo,
  toFirestoreTimestamp,
  fromFirestoreTimestamp,
  validateUser,
  validateUserPreferences,
  validateWeatherPreferences,
  defaultUserPreferences,
  defaultUserProfile,
  defaultWeatherPreferences,
} from '../../types/database';
import { User, UserPreferences, UserRole, UserStatus, AuthProviderType } from '../../types/auth';

/**
 * User-specific database service
 */
export class UserDatabaseService {
  /**
   * Create a new user profile in Firestore
   */
  async createUserProfile(userData: CreateUserProfile): Promise<User> {
    try {
      // Merge with defaults
      const userWithDefaults: CreateUserProfile = {
        ...userData,
        profile: { ...defaultUserProfile, ...userData.profile },
        preferences: { ...defaultUserPreferences, ...userData.preferences },
        metadata: {
          ...userData.metadata,
          createdAt: toFirestoreTimestamp(),
          updatedAt: toFirestoreTimestamp(),
          loginCount: 0,
        },
      };

      // Validate and create user document
      const createdUser = await firestoreService.createDocument(
        CollectionName.USERS,
        userWithDefaults,
        userData.uid,
        validateUser
      );

      // Create default weather preferences
      await this.createWeatherPreferences(userData.uid, defaultWeatherPreferences);

      // Log user creation activity
      await this.logUserActivity({
        uid: userData.uid,
        action: 'user_created',
        timestamp: toFirestoreTimestamp(),
        metadata: {
          provider: userData.primaryProvider,
          email: userData.email,
        },
      });

      return createdUser;
    } catch (error) {
      throw new FirestoreServiceError(
        'user_creation_failed',
        'Failed to create user profile',
        error as any
      );
    }
  }

  /**
   * Get user profile by UID
   */
  async getUserProfile(uid: string): Promise<User | null> {
    return await firestoreService.getDocument(
      CollectionName.USERS,
      uid,
      validateUser
    );
  }

  /**
   * Update user profile
   */
  async updateUserProfile(uid: string, updates: UpdateUserProfile): Promise<User> {
    // Add update timestamp to metadata
    const updateData = {
      ...updates,
      metadata: {
        ...updates.metadata,
        updatedAt: toFirestoreTimestamp(),
      },
    } as UpdateUserProfile;

    const updatedUser = await firestoreService.updateDocument(
      CollectionName.USERS,
      uid,
      updateData,
      validateUser
    );

    // Log profile update activity
    await this.logUserActivity({
      uid,
      action: 'profile_updated',
      timestamp: toFirestoreTimestamp(),
      metadata: {
        updatedFields: Object.keys(updates),
      },
    });

    return updatedUser;
  }

  /**
   * Update user preferences only
   */
  async updateUserPreferences(uid: string, preferences: UpdatePreferences): Promise<User> {
    const updateData = {
      preferences,
      metadata: {
        updatedAt: toFirestoreTimestamp(),
      },
    } as any;

    const updatedUser = await firestoreService.updateDocument(
      CollectionName.USERS,
      uid,
      updateData,
      validateUser
    );

    // Log preferences update activity
    await this.logUserActivity({
      uid,
      action: 'preferences_updated',
      timestamp: toFirestoreTimestamp(),
      metadata: {
        updatedPreferences: Object.keys(preferences),
      },
    });

    return updatedUser;
  }

  /**
   * Update basic profile information
   */
  async updateProfileInfo(uid: string, profileInfo: UpdateProfileInfo): Promise<User> {
    const updateData = {
      ...profileInfo,
      metadata: {
        updatedAt: toFirestoreTimestamp(),
      },
    } as any;

    const updatedUser = await firestoreService.updateDocument(
      CollectionName.USERS,
      uid,
      updateData,
      validateUser
    );

    // Log profile info update activity
    await this.logUserActivity({
      uid,
      action: 'profile_info_updated',
      timestamp: toFirestoreTimestamp(),
      metadata: {
        updatedFields: Object.keys(profileInfo),
      },
    });

    return updatedUser;
  }

  /**
   * Update user last login and activity
   */
  async updateUserActivity(uid: string): Promise<void> {
    const now = toFirestoreTimestamp();
    
    await firestoreService.updateDocument(
      CollectionName.USERS,
      uid,
      {
        metadata: {
          lastLoginAt: now,
          lastActiveAt: now,
          updatedAt: now,
        },
      }
    );

    // Log login activity
    await this.logUserActivity({
      uid,
      action: 'user_login',
      timestamp: now,
    });
  }

  /**
   * Increment user login count
   */
  async incrementLoginCount(uid: string): Promise<void> {
    const user = await this.getUserProfile(uid);
    if (user) {
      await firestoreService.updateDocument(
        CollectionName.USERS,
        uid,
        {
          metadata: {
            ...user.metadata,
            loginCount: user.metadata.loginCount + 1,
            lastLoginAt: toFirestoreTimestamp(),
            updatedAt: toFirestoreTimestamp(),
          },
        }
      );
    }
  }

  /**
   * Delete user profile
   */
  async deleteUserProfile(uid: string): Promise<void> {
    // Log deletion activity first
    await this.logUserActivity({
      uid,
      action: 'user_deleted',
      timestamp: toFirestoreTimestamp(),
    });

    // Delete user document
    await firestoreService.deleteDocument(CollectionName.USERS, uid);

    // Clean up related data
    await this.cleanupUserData(uid);
  }

  /**
   * Get users with pagination
   */
  async getUsers(options?: QueryOptions): Promise<PaginatedResult<User>> {
    return await firestoreService.getDocuments(
      CollectionName.USERS,
      options,
      validateUser
    );
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: UserRole, options?: QueryOptions): Promise<PaginatedResult<User>> {
    const roleOptions: QueryOptions = {
      ...options,
      where: [
        ...(options?.where || []),
        { field: 'role', operator: '==', value: role },
      ],
    };

    return await firestoreService.getDocuments(
      CollectionName.USERS,
      roleOptions,
      validateUser
    );
  }

  /**
   * Get users by status
   */
  async getUsersByStatus(status: UserStatus, options?: QueryOptions): Promise<PaginatedResult<User>> {
    const statusOptions: QueryOptions = {
      ...options,
      where: [
        ...(options?.where || []),
        { field: 'status', operator: '==', value: status },
      ],
    };

    return await firestoreService.getDocuments(
      CollectionName.USERS,
      statusOptions,
      validateUser
    );
  }

  /**
   * Search users by email or display name
   */
  async searchUsers(searchTerm: string, options?: QueryOptions): Promise<PaginatedResult<User>> {
    // Note: Firestore doesn't support full-text search. This is a simple prefix search.
    // For production, consider using Algolia or similar search service.
    const searchOptions: QueryOptions = {
      ...options,
      where: [
        ...(options?.where || []),
        { field: 'email', operator: '>=', value: searchTerm },
        { field: 'email', operator: '<=', value: searchTerm + '\uf8ff' },
      ],
    };

    return await firestoreService.getDocuments(
      CollectionName.USERS,
      searchOptions,
      validateUser
    );
  }

  /**
   * Subscribe to user profile changes
   */
  subscribeToUserProfile(uid: string, callback: (user: User | null) => void): Unsubscribe {
    return firestoreService.subscribeToDocument(
      CollectionName.USERS,
      uid,
      callback,
      validateUser
    );
  }

  /**
   * Subscribe to users list changes
   */
  subscribeToUsers(
    callback: (users: User[]) => void,
    options?: QueryOptions
  ): Unsubscribe {
    return firestoreService.subscribeToCollection(
      CollectionName.USERS,
      options,
      callback,
      validateUser
    );
  }

  /**
   * Weather preferences methods
   */
  async createWeatherPreferences(uid: string, preferences: WeatherPreferences): Promise<WeatherPreferences> {
    return await firestoreService.createDocument(
      CollectionName.USER_PREFERENCES,
      { uid, ...preferences },
      `${uid}_weather`,
      validateWeatherPreferences
    );
  }

  async getWeatherPreferences(uid: string): Promise<WeatherPreferences | null> {
    return await firestoreService.getDocument(
      CollectionName.USER_PREFERENCES,
      `${uid}_weather`,
      validateWeatherPreferences
    );
  }

  async updateWeatherPreferences(uid: string, preferences: Partial<WeatherPreferences>): Promise<WeatherPreferences> {
    return await firestoreService.updateDocument(
      CollectionName.USER_PREFERENCES,
      `${uid}_weather`,
      preferences,
      validateWeatherPreferences
    );
  }

  /**
   * User session tracking
   */
  async createUserSession(sessionData: Omit<UserSession, 'id'>): Promise<UserSession> {
    return await firestoreService.createDocument(
      CollectionName.USER_SESSIONS,
      sessionData
    );
  }

  async updateUserSession(sessionId: string, updates: Partial<UserSession>): Promise<UserSession> {
    return await firestoreService.updateDocument(
      CollectionName.USER_SESSIONS,
      sessionId,
      updates
    );
  }

  async getUserSessions(uid: string, options?: QueryOptions): Promise<PaginatedResult<UserSession>> {
    const sessionOptions: QueryOptions = {
      ...options,
      where: [
        ...(options?.where || []),
        { field: 'uid', operator: '==', value: uid },
      ],
    };

    return await firestoreService.getDocuments(
      CollectionName.USER_SESSIONS,
      sessionOptions
    );
  }

  /**
   * User activity logging
   */
  async logUserActivity(activity: Omit<UserActivity, 'id'>): Promise<UserActivity> {
    return await firestoreService.createDocument(
      CollectionName.USER_ACTIVITY,
      activity
    );
  }

  async getUserActivities(uid: string, options?: QueryOptions): Promise<PaginatedResult<UserActivity>> {
    const activityOptions: QueryOptions = {
      ...options,
      where: [
        ...(options?.where || []),
        { field: 'uid', operator: '==', value: uid },
      ],
      orderBy: options?.orderBy || { field: 'timestamp', direction: 'desc' },
    };

    return await firestoreService.getDocuments(
      CollectionName.USER_ACTIVITY,
      activityOptions
    );
  }

  /**
   * User notifications
   */
  async createUserNotification(notification: Omit<UserNotification, 'id'>): Promise<UserNotification> {
    return await firestoreService.createDocument(
      CollectionName.USER_NOTIFICATIONS,
      notification
    );
  }

  async getUserNotifications(uid: string, options?: QueryOptions): Promise<PaginatedResult<UserNotification>> {
    const notificationOptions: QueryOptions = {
      ...options,
      where: [
        ...(options?.where || []),
        { field: 'uid', operator: '==', value: uid },
      ],
      orderBy: options?.orderBy || { field: 'sentAt', direction: 'desc' },
    };

    return await firestoreService.getDocuments(
      CollectionName.USER_NOTIFICATIONS,
      notificationOptions
    );
  }

  async markNotificationAsRead(notificationId: string): Promise<UserNotification> {
    return await firestoreService.updateDocument(
      CollectionName.USER_NOTIFICATIONS,
      notificationId,
      {
        readAt: toFirestoreTimestamp(),
        status: 'read',
      }
    );
  }

  /**
   * Utility methods
   */
  async userExists(uid: string): Promise<boolean> {
    return await firestoreService.documentExists(CollectionName.USERS, uid);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await firestoreService.getDocuments(
      CollectionName.USERS,
      {
        where: [{ field: 'email', operator: '==', value: email }],
        limit: 1,
      },
      validateUser
    );

    return result.data.length > 0 ? result.data[0] : null;
  }

  async getUsersCount(filters?: { role?: UserRole; status?: UserStatus }): Promise<number> {
    const whereConditions = [];
    
    if (filters?.role) {
      whereConditions.push({ field: 'role', operator: '==', value: filters.role });
    }
    
    if (filters?.status) {
      whereConditions.push({ field: 'status', operator: '==', value: filters.status });
    }

    return await firestoreService.getCollectionSize(CollectionName.USERS, whereConditions as any);
  }

  /**
   * Cleanup user data when user is deleted
   */
  private async cleanupUserData(uid: string): Promise<void> {
    try {
      // Batch delete related documents
      await firestoreService.batchWrite([
        { type: 'delete', collectionName: CollectionName.USER_PREFERENCES, docId: `${uid}_weather` },
        // Add more cleanup operations as needed
      ]);

      // Note: Sessions, activities, and notifications might be kept for audit purposes
      // or deleted based on data retention policies
    } catch (error) {
      // Don't throw error as main user deletion succeeded
    }
  }

  /**
   * Batch operations for multiple users
   */
  async batchUpdateUsers(updates: Array<{ uid: string; data: UpdateUserProfile }>): Promise<void> {
    const operations = updates.map(update => ({
      type: 'update' as const,
      collectionName: CollectionName.USERS,
      docId: update.uid,
      data: {
        ...update.data,
        metadata: {
          ...update.data.metadata,
          updatedAt: toFirestoreTimestamp(),
        },
      },
    }));

    await firestoreService.batchWrite(operations);
  }
}

// Export singleton instance
export const userDatabaseService = new UserDatabaseService();
export default userDatabaseService;