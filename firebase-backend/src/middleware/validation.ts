import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from '../utils/logger';

interface ValidationSchema {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  headers?: Joi.ObjectSchema;
}

/**
 * Generic validation middleware factory
 */
export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: any[] = [];

    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map(detail => ({
          field: `body.${detail.path.join('.')}`,
          message: detail.message,
          value: detail.context?.value
        })));
      }
    }

    // Validate request parameters
    if (schema.params) {
      const { error } = schema.params.validate(req.params, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map(detail => ({
          field: `params.${detail.path.join('.')}`,
          message: detail.message,
          value: detail.context?.value
        })));
      }
    }

    // Validate query parameters
    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map(detail => ({
          field: `query.${detail.path.join('.')}`,
          message: detail.message,
          value: detail.context?.value
        })));
      }
    }

    // Validate headers
    if (schema.headers) {
      const { error } = schema.headers.validate(req.headers, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map(detail => ({
          field: `headers.${detail.path.join('.')}`,
          message: detail.message,
          value: detail.context?.value
        })));
      }
    }

    if (errors.length > 0) {
      logger.logSecurity('Validation failed', {
        path: req.path,
        method: req.method,
        errors,
        userId: req.user?.uid
      }, 'warn');

      res.status(400).json({
        error: 'Validation Error',
        message: 'Request validation failed',
        details: errors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
};

// Common validation schemas
export const commonValidations = {
  // Firebase UID validation
  firebaseUid: Joi.string()
    .pattern(/^[a-zA-Z0-9_-]{28}$/)
    .messages({
      'string.pattern.base': 'Invalid Firebase UID format'
    }),

  // Email validation
  email: Joi.string()
    .email({ minDomainSegments: 2 })
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),

  // Password validation
  password: Joi.string()
    .min(6)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    }),

  // Display name validation
  displayName: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .messages({
      'string.min': 'Display name is required',
      'string.max': 'Display name must not exceed 100 characters'
    }),

  // Phone number validation
  phoneNumber: Joi.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .messages({
      'string.pattern.base': 'Phone number must be in E.164 format (e.g., +1234567890)'
    }),

  // Pagination validation
  pagination: {
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
      .messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit must not exceed 100'
      }),

    offset: Joi.number()
      .integer()
      .min(0)
      .default(0)
      .messages({
        'number.min': 'Offset must be 0 or greater'
      }),

    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.min': 'Page must be 1 or greater'
      })
  },

  // Date validation
  date: Joi.date()
    .iso()
    .messages({
      'date.format': 'Date must be in ISO 8601 format'
    }),

  // URL validation
  url: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .messages({
      'string.uri': 'Must be a valid HTTP or HTTPS URL'
    }),

  // Role validation
  role: Joi.string()
    .valid('user', 'admin', 'superadmin')
    .default('user')
    .messages({
      'any.only': 'Role must be one of: user, admin, superadmin'
    }),

  // Object ID validation (for MongoDB-style IDs)
  objectId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid object ID format'
    })
};

// Auth-specific validation schemas
export const authSchemas = {
  register: {
    body: Joi.object({
      email: commonValidations.email.required(),
      password: commonValidations.password.required(),
      displayName: commonValidations.displayName.required(),
      phoneNumber: commonValidations.phoneNumber.optional()
    })
  },

  login: {
    body: Joi.object({
      email: commonValidations.email.required(),
      password: Joi.string().required().messages({
        'any.required': 'Password is required'
      })
    })
  },

  resetPassword: {
    body: Joi.object({
      email: commonValidations.email.required()
    })
  },

  changePassword: {
    body: Joi.object({
      currentPassword: Joi.string().required().messages({
        'any.required': 'Current password is required'
      }),
      newPassword: commonValidations.password.required()
    })
  },

  refreshToken: {
    body: Joi.object({
      refreshToken: Joi.string().required().messages({
        'any.required': 'Refresh token is required'
      })
    })
  }
};

// User-specific validation schemas
export const userSchemas = {
  getUserById: {
    params: Joi.object({
      userId: commonValidations.firebaseUid.required()
    })
  },

  updateProfile: {
    params: Joi.object({
      userId: commonValidations.firebaseUid.required()
    }),
    body: Joi.object({
      displayName: commonValidations.displayName.optional(),
      phoneNumber: commonValidations.phoneNumber.optional(),
      photoURL: commonValidations.url.optional(),
      bio: Joi.string().max(500).optional().messages({
        'string.max': 'Bio must not exceed 500 characters'
      }),
      website: commonValidations.url.optional(),
      location: Joi.string().max(100).optional().messages({
        'string.max': 'Location must not exceed 100 characters'
      })
    }).min(1).messages({
      'object.min': 'At least one field must be provided for update'
    })
  },

  updateRole: {
    params: Joi.object({
      userId: commonValidations.firebaseUid.required()
    }),
    body: Joi.object({
      role: commonValidations.role.required()
    })
  },

  listUsers: {
    query: Joi.object({
      limit: commonValidations.pagination.limit,
      page: commonValidations.pagination.page,
      role: commonValidations.role.optional(),
      search: Joi.string().max(100).optional().messages({
        'string.max': 'Search term must not exceed 100 characters'
      }),
      sortBy: Joi.string().valid('createdAt', 'displayName', 'email', 'lastLoginAt').default('createdAt'),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc')
    })
  }
};

// File upload validation
export const fileUploadSchemas = {
  uploadImage: {
    body: Joi.object({
      alt: Joi.string().max(200).optional().messages({
        'string.max': 'Alt text must not exceed 200 characters'
      }),
      description: Joi.string().max(500).optional().messages({
        'string.max': 'Description must not exceed 500 characters'
      })
    })
  }
};

// Custom validation helper functions
export const customValidators = {
  /**
   * Validate if the user is updating their own resource
   */
  validateOwnership: (req: Request): boolean => {
    const resourceUserId = req.params.userId;
    const currentUserId = req.user?.uid;
    return resourceUserId === currentUserId;
  },

  /**
   * Validate if the provided date is in the future
   */
  validateFutureDate: (date: Date): boolean => {
    return date > new Date();
  },

  /**
   * Validate if the provided date is in the past
   */
  validatePastDate: (date: Date): boolean => {
    return date < new Date();
  },

  /**
   * Validate strong password
   */
  validateStrongPassword: (password: string): boolean => {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  }
};

export { validate as validationMiddleware };