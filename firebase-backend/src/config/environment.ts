import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  nodeEnv: string;
  port: number;
  apiVersion: string;
  
  firebase: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
    databaseUrl: string;
    webApiKey?: string;
    authDomain?: string;
    measurementId?: string;
  };

  oauth: {
    google: {
      clientId: string;
      clientSecret: string;
      enabled: boolean;
    };
    apple: {
      clientId: string;
      teamId: string;
      keyId: string;
      privateKey: string;
      enabled: boolean;
    };
    redirectUrl: string;
    successRedirect: string;
    errorRedirect: string;
  };

  socialProviders: {
    google: boolean;
    apple: boolean;
    facebook: boolean;
    github: boolean;
  };
  
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  
  security: {
    bcryptRounds: number;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
  };
  
  cors: {
    allowedOrigins: string[];
  };
  
  email?: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
  };
  
  logging: {
    level: string;
    file: string;
  };
  
  upload: {
    maxFileSize: number;
    uploadPath: string;
    allowedFileTypes: string[];
  };
  
  features: {
    enableRegistration: boolean;
    enableEmailVerification: boolean;
    enablePasswordReset: boolean;
    enableSocialLogin: boolean;
    enableAccountLinking: boolean;
    enableProviderUnlinking: boolean;
  };
  
  external?: {
    apiKey: string;
    serviceUrl: string;
  };
  
  monitoring?: {
    sentryDsn: string;
    googleAnalyticsId: string;
  };
  
  development: {
    mockExternalServices: boolean;
    enableDebugRoutes: boolean;
  };
}

function validateEnvironment(): void {
  const required = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL', 
    'FIREBASE_PRIVATE_KEY',
    'JWT_SECRET'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

function parseBoolean(value: string | undefined, defaultValue: boolean = false): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

function parseNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function parseStringArray(value: string | undefined, defaultValue: string[] = []): string[] {
  if (!value) return defaultValue;
  return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
}

// Validate required environment variables
if (process.env.NODE_ENV !== 'test') {
  validateEnvironment();
}

export const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseNumber(process.env.PORT, 3000),
  apiVersion: process.env.API_VERSION || 'v1',
  
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
    databaseUrl: process.env.FIREBASE_DATABASE_URL || '',
    webApiKey: process.env.FIREBASE_WEB_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
  },

  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      enabled: parseBoolean(process.env.GOOGLE_OAUTH_ENABLED, true)
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID || '',
      teamId: process.env.APPLE_TEAM_ID || '',
      keyId: process.env.APPLE_KEY_ID || '',
      privateKey: process.env.APPLE_PRIVATE_KEY || '',
      enabled: parseBoolean(process.env.APPLE_OAUTH_ENABLED, true)
    },
    redirectUrl: process.env.OAUTH_REDIRECT_URL || '',
    successRedirect: process.env.OAUTH_SUCCESS_REDIRECT || '/dashboard',
    errorRedirect: process.env.OAUTH_ERROR_REDIRECT || '/login?error=oauth_failed'
  },

  socialProviders: {
    google: parseBoolean(process.env.GOOGLE_OAUTH_ENABLED, true),
    apple: parseBoolean(process.env.APPLE_OAUTH_ENABLED, true),
    facebook: parseBoolean(process.env.FACEBOOK_OAUTH_ENABLED, false),
    github: parseBoolean(process.env.GITHUB_OAUTH_ENABLED, false)
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  
  security: {
    bcryptRounds: parseNumber(process.env.BCRYPT_ROUNDS, 12),
    rateLimitWindowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 900000), // 15 minutes
    rateLimitMaxRequests: parseNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100)
  },
  
  cors: {
    allowedOrigins: parseStringArray(
      process.env.ALLOWED_ORIGINS, 
      ['http://localhost:3000', 'http://localhost:3001']
    )
  },
  
  email: process.env.SMTP_HOST ? {
    smtpHost: process.env.SMTP_HOST,
    smtpPort: parseNumber(process.env.SMTP_PORT, 587),
    smtpUser: process.env.SMTP_USER || '',
    smtpPassword: process.env.SMTP_PASSWORD || '',
    fromEmail: process.env.FROM_EMAIL || 'noreply@example.com'
  } : undefined,
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log'
  },
  
  upload: {
    maxFileSize: parseNumber(process.env.MAX_FILE_SIZE, 5242880), // 5MB
    uploadPath: process.env.UPLOAD_PATH || 'uploads/',
    allowedFileTypes: parseStringArray(
      process.env.ALLOWED_FILE_TYPES,
      ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    )
  },
  
  features: {
    enableRegistration: parseBoolean(process.env.ENABLE_REGISTRATION, true),
    enableEmailVerification: parseBoolean(process.env.ENABLE_EMAIL_VERIFICATION, false),
    enablePasswordReset: parseBoolean(process.env.ENABLE_PASSWORD_RESET, true),
    enableSocialLogin: parseBoolean(process.env.ENABLE_SOCIAL_LOGIN, true),
    enableAccountLinking: parseBoolean(process.env.ENABLE_ACCOUNT_LINKING, true),
    enableProviderUnlinking: parseBoolean(process.env.ENABLE_PROVIDER_UNLINKING, true)
  },
  
  external: process.env.EXTERNAL_API_KEY ? {
    apiKey: process.env.EXTERNAL_API_KEY,
    serviceUrl: process.env.THIRD_PARTY_SERVICE_URL || ''
  } : undefined,
  
  monitoring: process.env.SENTRY_DSN ? {
    sentryDsn: process.env.SENTRY_DSN,
    googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID || ''
  } : undefined,
  
  development: {
    mockExternalServices: parseBoolean(process.env.MOCK_EXTERNAL_SERVICES, true),
    enableDebugRoutes: parseBoolean(process.env.ENABLE_DEBUG_ROUTES, config.nodeEnv === 'development')
  }
};

export default config;