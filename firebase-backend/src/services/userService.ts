import { Timestamp, Query } from 'firebase-admin/firestore';
import firebaseConfig from '../config/firebase';
import logger from '../utils/logger';
import {
  IUser,
  IUpdateUser,
  IUserResponse,
  IUserListResponse,
  IPublicUserProfile,
  UserRole,
  UserStatus,
  UserTransformers
} from '../models/User';
import { CustomError } from '../middleware/errorHandler';

export interface IUserListFilters {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  limit?: number;
  page?: number;
  sortBy?: 'createdAt' | 'displayName' | 'email' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}

export class UserService {
  private readonly usersCollection = 'users';
  private readonly profilesCollection = 'profiles';
  private readonly activitiesCollection = 'activities';

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<IUserResponse> {
    try {
      const userDoc = await firebaseConfig.getDocument(this.usersCollection, userId);
      
      if (!userDoc.exists) {
        throw new CustomError('User not found', 404);
      }

      const user = UserTransformers.fromFirestore(userDoc);
      
      if (user.isDeleted) {
        throw new CustomError('User not found', 404);
      }

      logger.logDatabase('get', this.usersCollection, userId, true);
      
      return UserTransformers.toPublicResponse(user);

    } catch (error) {
      logger.logError(error as Error, { service: 'userService', method: 'getUserById' });
      
      if (error instanceof CustomError) {
        throw error;
      }
      
      throw new CustomError('Failed to get user', 500);
    }
  }

  /**
   * Get user profile (public information)
   */
  async getUserProfile(userId: string): Promise<IPublicUserProfile> {
    try {
      const userDoc = await firebaseConfig.getDocument(this.usersCollection, userId);
      
      if (!userDoc.exists) {
        throw new CustomError('User profile not found', 404);
      }

      const user = UserTransformers.fromFirestore(userDoc);
      
      if (user.isDeleted || user.status !== UserStatus.ACTIVE) {
        throw new CustomError('User profile not found', 404);
      }

      // Check privacy settings
      if (!user.preferences.privacy.profileVisible) {
        throw new CustomError('User profile is private', 403);
      }

      return UserTransformers.toPublicProfile(user);

    } catch (error) {
      logger.logError(error as Error, { service: 'userService', method: 'getUserProfile' });
      
      if (error instanceof CustomError) {
        throw error;
      }
      
      throw new CustomError('Failed to get user profile', 500);
    }
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updateData: IUpdateUser, updatedBy?: string): Promise<IUserResponse> {
    try {
      // Get current user data
      const userDoc = await firebaseConfig.getDocument(this.usersCollection, userId);
      
      if (!userDoc.exists) {
        throw new CustomError('User not found', 404);
      }

      const currentUser = UserTransformers.fromFirestore(userDoc);
      
      if (currentUser.isDeleted) {
        throw new CustomError('User not found', 404);
      }

      // Prepare update data
      const updatePayload: any = {
        'metadata.updatedAt': Timestamp.now()
      };

      // Handle basic profile updates
      if (updateData.displayName !== undefined) {
        updatePayload.displayName = updateData.displayName;
        
        // Also update in Firebase Auth
        await firebaseConfig.updateUser(userId, {
          displayName: updateData.displayName
        });
      }

      if (updateData.photoURL !== undefined) {
        updatePayload.photoURL = updateData.photoURL;
        
        // Also update in Firebase Auth
        await firebaseConfig.updateUser(userId, {
          photoURL: updateData.photoURL
        });
      }

      if (updateData.phoneNumber !== undefined) {
        updatePayload.phoneNumber = updateData.phoneNumber;
        
        // Also update in Firebase Auth
        await firebaseConfig.updateUser(userId, {
          phoneNumber: updateData.phoneNumber
        });
      }

      // Handle profile data updates
      if (updateData.profile) {
        Object.keys(updateData.profile).forEach(key => {
          updatePayload[`profile.${key}`] = updateData.profile![key as keyof typeof updateData.profile];
        });
      }

      // Handle preferences updates
      if (updateData.preferences) {
        Object.keys(updateData.preferences).forEach(key => {
          const value = updateData.preferences![key as keyof typeof updateData.preferences];
          if (typeof value === 'object' && value !== null) {
            // Handle nested objects (like notifications, privacy)
            Object.keys(value).forEach(nestedKey => {
              updatePayload[`preferences.${key}.${nestedKey}`] = (value as any)[nestedKey];
            });
          } else {
            updatePayload[`preferences.${key}`] = value;
          }
        });
      }

      // Handle admin-only updates
      if (updateData.role !== undefined && updatedBy !== userId) {
        updatePayload.role = updateData.role;
        
        // Update custom claims
        await this.updateUserClaims(userId, updateData.role);
      }

      if (updateData.status !== undefined && updatedBy !== userId) {
        updatePayload.status = updateData.status;
      }

      if (updateData.tags !== undefined && updatedBy !== userId) {
        updatePayload.tags = updateData.tags;
      }

      if (updateData.notes !== undefined && updatedBy !== userId) {
        updatePayload.notes = updateData.notes;
      }

      // Update the document
      await firebaseConfig.updateDocument(this.usersCollection, userId, updatePayload);

      // Log the update
      await this.logUserActivity(userId, 'profile_updated', 'User profile updated', {
        updatedBy: updatedBy || userId,
        updatedFields: Object.keys(updatePayload)
      });

      logger.logDatabase('update', this.usersCollection, userId, true);

      // Return updated user
      const updatedUserDoc = await firebaseConfig.getDocument(this.usersCollection, userId);
      const updatedUser = UserTransformers.fromFirestore(updatedUserDoc);
      
      return UserTransformers.toPublicResponse(updatedUser);

    } catch (error) {
      logger.logError(error as Error, { service: 'userService', method: 'updateUser' });
      
      if (error instanceof CustomError) {
        throw error;
      }
      
      throw new CustomError('Failed to update user', 500);
    }
  }

  /**
   * List users with filtering and pagination
   */
  async listUsers(filters: IUserListFilters = {}): Promise<IUserListResponse> {
    try {
      const {
        role,
        status,
        search,
        limit = 20,
        page = 1,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      let query: Query = firebaseConfig.firestore
        .collection(this.usersCollection)
        .where('isDeleted', '==', false);

      // Apply filters
      if (role) {
        query = query.where('role', '==', role);
      }

      if (status) {
        query = query.where('status', '==', status);
      }

      // Apply sorting
      const direction = sortOrder === 'asc' ? 'asc' : 'desc';
      query = query.orderBy(`metadata.${sortBy}`, direction);

      // Calculate pagination
      const offset = (page - 1) * limit;
      
      // Get total count (for pagination info)
      const countQuery = query.select(); // Select no fields for counting
      const countSnapshot = await countQuery.get();
      const total = countSnapshot.size;

      // Apply pagination
      query = query.offset(offset).limit(limit);

      // Execute query
      const querySnapshot = await query.get();
      
      let users = querySnapshot.docs.map(doc => {
        const user = UserTransformers.fromFirestore(doc);
        return UserTransformers.toPublicResponse(user);
      });

      // Apply search filter (post-query for complex search)
      if (search) {
        const searchLower = search.toLowerCase();
        users = users.filter(user => 
          user.displayName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          (user.profile.bio && user.profile.bio.toLowerCase().includes(searchLower))
        );
      }

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      logger.logDatabase('query', this.usersCollection, undefined, true);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage,
          hasPrevPage
        },
        filters: {
          role,
          status,
          search
        }
      };

    } catch (error) {
      logger.logError(error as Error, { service: 'userService', method: 'listUsers' });
      throw new CustomError('Failed to list users', 500);
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(userId: string, deletedBy?: string): Promise<void> {
    try {
      const userDoc = await firebaseConfig.getDocument(this.usersCollection, userId);
      
      if (!userDoc.exists) {
        throw new CustomError('User not found', 404);
      }

      const user = UserTransformers.fromFirestore(userDoc);
      
      if (user.isDeleted) {
        throw new CustomError('User already deleted', 409);
      }

      // Soft delete
      await firebaseConfig.updateDocument(this.usersCollection, userId, {
        isDeleted: true,
        status: UserStatus.INACTIVE,
        'metadata.updatedAt': Timestamp.now()
      });

      // Log the deletion
      await this.logUserActivity(userId, 'account_deleted', 'User account deleted', {
        deletedBy: deletedBy || userId
      });

      logger.logDatabase('delete', this.usersCollection, userId, true);

    } catch (error) {
      logger.logError(error as Error, { service: 'userService', method: 'deleteUser' });
      
      if (error instanceof CustomError) {
        throw error;
      }
      
      throw new CustomError('Failed to delete user', 500);
    }
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, role: UserRole, updatedBy: string): Promise<IUserResponse> {
    try {
      const userDoc = await firebaseConfig.getDocument(this.usersCollection, userId);
      
      if (!userDoc.exists) {
        throw new CustomError('User not found', 404);
      }

      const user = UserTransformers.fromFirestore(userDoc);
      
      if (user.isDeleted) {
        throw new CustomError('User not found', 404);
      }

      // Update role
      await firebaseConfig.updateDocument(this.usersCollection, userId, {
        role,
        'metadata.updatedAt': Timestamp.now()
      });

      // Update custom claims
      await this.updateUserClaims(userId, role);

      // Log the role change
      await this.logUserActivity(userId, 'role_changed', `User role changed to ${role}`, {
        updatedBy,
        previousRole: user.role,
        newRole: role
      });

      logger.logDatabase('update', this.usersCollection, userId, true);

      // Return updated user
      const updatedUserDoc = await firebaseConfig.getDocument(this.usersCollection, userId);
      const updatedUser = UserTransformers.fromFirestore(updatedUserDoc);
      
      return UserTransformers.toPublicResponse(updatedUser);

    } catch (error) {
      logger.logError(error as Error, { service: 'userService', method: 'updateUserRole' });
      
      if (error instanceof CustomError) {
        throw error;
      }
      
      throw new CustomError('Failed to update user role', 500);
    }
  }

  /**
   * Update user status (admin only)
   */
  async updateUserStatus(userId: string, status: UserStatus, updatedBy: string): Promise<IUserResponse> {
    try {
      const userDoc = await firebaseConfig.getDocument(this.usersCollection, userId);
      
      if (!userDoc.exists) {
        throw new CustomError('User not found', 404);
      }

      const user = UserTransformers.fromFirestore(userDoc);
      
      if (user.isDeleted) {
        throw new CustomError('User not found', 404);
      }

      // Update status
      await firebaseConfig.updateDocument(this.usersCollection, userId, {
        status,
        'metadata.updatedAt': Timestamp.now()
      });

      // If suspending user, revoke tokens
      if (status === UserStatus.SUSPENDED) {
        await firebaseConfig.auth.revokeRefreshTokens(userId);
      }

      // Log the status change
      await this.logUserActivity(userId, 'status_changed', `User status changed to ${status}`, {
        updatedBy,
        previousStatus: user.status,
        newStatus: status
      });

      logger.logDatabase('update', this.usersCollection, userId, true);

      // Return updated user
      const updatedUserDoc = await firebaseConfig.getDocument(this.usersCollection, userId);
      const updatedUser = UserTransformers.fromFirestore(updatedUserDoc);
      
      return UserTransformers.toPublicResponse(updatedUser);

    } catch (error) {
      logger.logError(error as Error, { service: 'userService', method: 'updateUserStatus' });
      
      if (error instanceof CustomError) {
        throw error;
      }
      
      throw new CustomError('Failed to update user status', 500);
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    byRole: { [key: string]: number };
    recentSignups: number;
  }> {
    try {
      // Get all users (non-deleted)
      const allUsersQuery = firebaseConfig.firestore
        .collection(this.usersCollection)
        .where('isDeleted', '==', false);
      
      const allUsersSnapshot = await allUsersQuery.get();
      const users = allUsersSnapshot.docs.map(doc => UserTransformers.fromFirestore(doc));

      // Calculate statistics
      const total = users.length;
      const active = users.filter(u => u.status === UserStatus.ACTIVE).length;
      const inactive = users.filter(u => u.status === UserStatus.INACTIVE).length;
      const suspended = users.filter(u => u.status === UserStatus.SUSPENDED).length;

      // Count by role
      const byRole = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      // Recent signups (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentSignups = users.filter(u => 
        u.metadata.createdAt.toDate() >= thirtyDaysAgo
      ).length;

      return {
        total,
        active,
        inactive,
        suspended,
        byRole,
        recentSignups
      };

    } catch (error) {
      logger.logError(error as Error, { service: 'userService', method: 'getUserStats' });
      throw new CustomError('Failed to get user statistics', 500);
    }
  }

  // Private helper methods

  private async updateUserClaims(userId: string, role: UserRole): Promise<void> {
    const permissions = this.getRolePermissions(role);
    const customClaims = {
      role,
      permissions
    };

    await firebaseConfig.setCustomUserClaims(userId, customClaims);
    
    // Also update in user document
    await firebaseConfig.updateDocument(this.usersCollection, userId, {
      customClaims,
      'metadata.updatedAt': Timestamp.now()
    });
  }

  private getRolePermissions(role: UserRole): string[] {
    const permissions = {
      [UserRole.USER]: ['user:read:own', 'user:update:own', 'profile:read'],
      [UserRole.ADMIN]: [
        'user:read:own', 'user:update:own', 'user:read:any', 'user:update:any',
        'profile:read', 'admin:read', 'admin:write'
      ],
      [UserRole.SUPER_ADMIN]: ['*']
    };

    return permissions[role] || permissions[UserRole.USER];
  }

  private async logUserActivity(
    userId: string,
    action: string,
    description: string,
    metadata?: any
  ): Promise<void> {
    try {
      const activity = {
        userId,
        action,
        description,
        metadata,
        createdAt: Timestamp.now()
      };

      await firebaseConfig.firestore
        .collection(this.activitiesCollection)
        .add(activity);

    } catch (error) {
      // Log error but don't fail the main operation
      logger.logError(error as Error, { 
        service: 'userService', 
        method: 'logUserActivity',
        userId,
        action 
      });
    }
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService;