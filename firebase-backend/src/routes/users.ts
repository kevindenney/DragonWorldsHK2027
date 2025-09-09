import { Router } from 'express';
import { userController } from '../controllers/userController';
import { 
  authMiddleware, 
  requireRole, 
  requireAdmin, 
  requireOwnershipOrAdmin 
} from '../middleware/auth';
import { validate, userSchemas } from '../middleware/validation';

const router = Router();

/**
 * @route GET /api/v1/users/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', 
  authMiddleware,
  userController.getCurrentUser
);

/**
 * @route PUT /api/v1/users/me
 * @desc Update current user profile
 * @access Private
 */
router.put('/me', 
  authMiddleware,
  validate(userSchemas.updateProfile),
  userController.updateCurrentUser
);

/**
 * @route GET /api/v1/users/search
 * @desc Search users by name or email
 * @access Private
 */
router.get('/search', 
  authMiddleware,
  userController.searchUsers
);

/**
 * @route GET /api/v1/users/stats
 * @desc Get user statistics
 * @access Admin
 */
router.get('/stats', 
  authMiddleware,
  requireAdmin,
  userController.getUserStats
);

/**
 * @route GET /api/v1/users
 * @desc List all users with filtering and pagination
 * @access Admin
 */
router.get('/', 
  authMiddleware,
  requireAdmin,
  validate(userSchemas.listUsers),
  userController.listUsers
);

/**
 * @route POST /api/v1/users/bulk-update
 * @desc Bulk update multiple users
 * @access SuperAdmin
 */
router.post('/bulk-update', 
  authMiddleware,
  requireRole('superadmin'),
  userController.bulkUpdateUsers
);

/**
 * @route GET /api/v1/users/:userId
 * @desc Get user by ID
 * @access Private (own profile) / Admin (any profile)
 */
router.get('/:userId', 
  authMiddleware,
  validate(userSchemas.getUserById),
  requireOwnershipOrAdmin('userId'),
  userController.getUserById
);

/**
 * @route PUT /api/v1/users/:userId
 * @desc Update user profile
 * @access Private (own profile) / Admin (any profile)
 */
router.put('/:userId', 
  authMiddleware,
  validate(userSchemas.updateProfile),
  requireOwnershipOrAdmin('userId'),
  userController.updateUser
);

/**
 * @route DELETE /api/v1/users/:userId
 * @desc Delete user (soft delete)
 * @access Private (own account) / Admin (any account)
 */
router.delete('/:userId', 
  authMiddleware,
  validate(userSchemas.getUserById),
  requireOwnershipOrAdmin('userId'),
  userController.deleteUser
);

/**
 * @route GET /api/v1/users/:userId/profile
 * @desc Get public user profile
 * @access Public (if profile is public)
 */
router.get('/:userId/profile', 
  validate(userSchemas.getUserById),
  userController.getUserProfile
);

/**
 * @route GET /api/v1/users/:userId/activity
 * @desc Get user activity log
 * @access Admin
 */
router.get('/:userId/activity', 
  authMiddleware,
  requireAdmin,
  validate(userSchemas.getUserById),
  userController.getUserActivity
);

// Admin-only routes
/**
 * @route PUT /api/v1/users/:userId/role
 * @desc Update user role
 * @access Admin
 */
router.put('/:userId/role', 
  authMiddleware,
  requireAdmin,
  validate(userSchemas.updateRole),
  userController.updateUserRole
);

/**
 * @route PUT /api/v1/users/:userId/status
 * @desc Update user status
 * @access Admin
 */
router.put('/:userId/status', 
  authMiddleware,
  requireAdmin,
  validate({
    params: userSchemas.getUserById.params,
    body: userSchemas.updateRole.body // Reuse the same validation pattern
  }),
  userController.updateUserStatus
);

export default router;