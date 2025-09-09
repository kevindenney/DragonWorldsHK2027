import { Request, Response } from 'express';
import { userService, IUserListFilters } from '../services/userService';
import { CustomError, asyncHandler } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { UserRole, UserStatus } from '../models/User';

export class UserController {
  /**
   * Get user by ID
   */
  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const currentUserId = req.user!.uid;
    const userRole = req.user!.role || 'user';

    // Check if user can access this profile
    if (userId !== currentUserId && !['admin', 'superadmin'].includes(userRole)) {
      throw new CustomError('Access denied', 403);
    }

    const user = await userService.getUserById(userId);

    res.json({
      success: true,
      data: user
    });
  });

  /**
   * Get public user profile
   */
  getUserProfile = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const profile = await userService.getUserProfile(userId);

    res.json({
      success: true,
      data: profile
    });
  });

  /**
   * Update user profile
   */
  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const currentUserId = req.user!.uid;
    const userRole = req.user!.role || 'user';
    const updateData = req.body;

    // Check if user can update this profile
    if (userId !== currentUserId && !['admin', 'superadmin'].includes(userRole)) {
      throw new CustomError('Access denied', 403);
    }

    // Remove sensitive fields that only admins can update
    if (userId === currentUserId && userRole === 'user') {
      delete updateData.role;
      delete updateData.status;
      delete updateData.tags;
      delete updateData.notes;
    }

    const updatedUser = await userService.updateUser(userId, updateData, currentUserId);

    logger.info('User profile updated', {
      userId,
      updatedBy: currentUserId,
      updatedFields: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  });

  /**
   * List users with filters and pagination (admin only)
   */
  listUsers = asyncHandler(async (req: Request, res: Response) => {
    const filters: IUserListFilters = {
      role: req.query.role as UserRole,
      status: req.query.status as UserStatus,
      search: req.query.search as string,
      limit: parseInt(req.query.limit as string) || 20,
      page: parseInt(req.query.page as string) || 1,
      sortBy: (req.query.sortBy as any) || 'createdAt',
      sortOrder: (req.query.sortOrder as any) || 'desc'
    };

    const result = await userService.listUsers(filters);

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * Delete user (soft delete)
   */
  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const currentUserId = req.user!.uid;
    const userRole = req.user!.role || 'user';

    // Check permissions
    if (userId !== currentUserId && !['admin', 'superadmin'].includes(userRole)) {
      throw new CustomError('Access denied', 403);
    }

    // Prevent admins from deleting other admins (only superadmin can do this)
    if (userId !== currentUserId && userRole === 'admin') {
      const targetUser = await userService.getUserById(userId);
      if (['admin', 'superadmin'].includes(targetUser.role)) {
        throw new CustomError('Insufficient permissions to delete admin users', 403);
      }
    }

    await userService.deleteUser(userId, currentUserId);

    logger.info('User deleted', {
      userId,
      deletedBy: currentUserId
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  });

  /**
   * Update user role (admin only)
   */
  updateUserRole = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { role } = req.body;
    const currentUserId = req.user!.uid;
    const currentUserRole = req.user!.role || 'user';

    if (!role || !Object.values(UserRole).includes(role)) {
      throw new CustomError('Valid role is required', 400);
    }

    // Only superadmin can create other admins or superadmins
    if ((role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) && currentUserRole !== UserRole.SUPER_ADMIN) {
      throw new CustomError('Only superadmin can assign admin roles', 403);
    }

    // Prevent role changes to self
    if (userId === currentUserId) {
      throw new CustomError('Cannot change your own role', 400);
    }

    const updatedUser = await userService.updateUserRole(userId, role, currentUserId);

    logger.info('User role updated', {
      userId,
      newRole: role,
      updatedBy: currentUserId
    });

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: updatedUser
    });
  });

  /**
   * Update user status (admin only)
   */
  updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { status } = req.body;
    const currentUserId = req.user!.uid;

    if (!status || !Object.values(UserStatus).includes(status)) {
      throw new CustomError('Valid status is required', 400);
    }

    // Prevent status changes to self
    if (userId === currentUserId) {
      throw new CustomError('Cannot change your own status', 400);
    }

    const updatedUser = await userService.updateUserStatus(userId, status, currentUserId);

    logger.info('User status updated', {
      userId,
      newStatus: status,
      updatedBy: currentUserId
    });

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: updatedUser
    });
  });

  /**
   * Get user statistics (admin only)
   */
  getUserStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await userService.getUserStats();

    res.json({
      success: true,
      data: stats
    });
  });

  /**
   * Search users by display name or email
   */
  searchUsers = asyncHandler(async (req: Request, res: Response) => {
    const { q: query, limit = 10 } = req.query;

    if (!query || typeof query !== 'string') {
      throw new CustomError('Search query is required', 400);
    }

    if (query.length < 2) {
      throw new CustomError('Search query must be at least 2 characters', 400);
    }

    const filters: IUserListFilters = {
      search: query,
      limit: Math.min(parseInt(limit as string) || 10, 50), // Max 50 results
      page: 1,
      status: UserStatus.ACTIVE // Only search active users
    };

    const result = await userService.listUsers(filters);

    res.json({
      success: true,
      data: {
        users: result.users,
        total: result.pagination.total,
        query
      }
    });
  });

  /**
   * Get current user's own profile
   */
  getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.uid;
    const user = await userService.getUserById(userId);

    res.json({
      success: true,
      data: user
    });
  });

  /**
   * Update current user's own profile
   */
  updateCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.uid;
    const updateData = req.body;

    // Remove admin-only fields
    delete updateData.role;
    delete updateData.status;
    delete updateData.tags;
    delete updateData.notes;

    const updatedUser = await userService.updateUser(userId, updateData, userId);

    logger.info('User updated own profile', {
      userId,
      updatedFields: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  });

  /**
   * Get user activity log (admin only)
   */
  getUserActivity = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    const firebaseConfig = await import('../config/firebase').then(m => m.default);
    
    const query = firebaseConfig.firestore
      .collection('activities')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit as string))
      .offset((parseInt(page as string) - 1) * parseInt(limit as string));

    const snapshot = await query.get();
    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate().toISOString()
    }));

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: snapshot.size
        }
      }
    });
  });

  /**
   * Bulk update users (superadmin only)
   */
  bulkUpdateUsers = asyncHandler(async (req: Request, res: Response) => {
    const { userIds, updateData } = req.body;
    const currentUserId = req.user!.uid;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new CustomError('User IDs array is required', 400);
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      throw new CustomError('Update data is required', 400);
    }

    // Limit bulk operations
    if (userIds.length > 100) {
      throw new CustomError('Cannot update more than 100 users at once', 400);
    }

    const results = [];
    const errors = [];

    for (const userId of userIds) {
      try {
        if (userId === currentUserId) {
          errors.push({ userId, error: 'Cannot bulk update your own account' });
          continue;
        }

        const updatedUser = await userService.updateUser(userId, updateData, currentUserId);
        results.push({ userId, success: true, user: updatedUser });
      } catch (error) {
        errors.push({ 
          userId, 
          error: error instanceof Error ? error.message : 'Update failed' 
        });
      }
    }

    logger.info('Bulk user update completed', {
      totalUsers: userIds.length,
      successful: results.length,
      failed: errors.length,
      updatedBy: currentUserId
    });

    res.json({
      success: true,
      message: `Bulk update completed. ${results.length} successful, ${errors.length} failed`,
      data: {
        results,
        errors,
        summary: {
          total: userIds.length,
          successful: results.length,
          failed: errors.length
        }
      }
    });
  });
}

// Export singleton instance
export const userController = new UserController();
export default userController;