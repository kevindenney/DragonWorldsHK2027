import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import path from 'path';

// Import configuration and utilities
import { config } from './config/environment';
import logger from './utils/logger';
import firebaseConfig from './config/firebase';

// Import middleware
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { validationMiddleware } from './middleware/validation';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import oauthRoutes from './routes/oauth';

class App {
  public app: Application;
  private rateLimiter: RateLimiterMemory;

  constructor() {
    this.app = express();
    this.initializeRateLimiter();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeRateLimiter(): void {
    this.rateLimiter = new RateLimiterMemory({
      keyGenerator: (req: Request) => req.ip,
      points: config.security.rateLimitMaxRequests,
      duration: Math.floor(config.security.rateLimitWindowMs / 1000), // Convert to seconds
    });
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (config.cors.allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        return callback(new Error('Not allowed by CORS'), false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control'
      ]
    }));

    // Body parsing middleware
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        // Store raw body for webhook verification if needed
        (req as any).rawBody = buf;
      }
    }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression middleware
    this.app.use(compression());

    // Request logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      // Log request
      logger.info(`${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer')
      });

      // Log response when finished
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.logRequest(req, res, duration);
      });

      next();
    });

    // Rate limiting middleware
    this.app.use(async (req: Request, res: Response, next: NextFunction) => {
      try {
        await this.rateLimiter.consume(req.ip);
        next();
      } catch (rateLimiterRes: any) {
        logger.logSecurity('Rate limit exceeded', { 
          ip: req.ip, 
          path: req.path,
          remainingPoints: rateLimiterRes.remainingPoints,
          msBeforeNext: rateLimiterRes.msBeforeNext
        }, 'warn');

        res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded, please try again later.',
          retryAfter: Math.round(rateLimiterRes.msBeforeNext / 1000)
        });
      }
    });

    // Health check endpoint (before auth middleware)
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: config.nodeEnv
      });
    });

    // API documentation endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'Firebase Backend API',
        version: process.env.npm_package_version || '1.0.0',
        description: 'Firebase backend with Node.js, TypeScript, and authentication',
        environment: config.nodeEnv,
        endpoints: {
          auth: `/api/${config.apiVersion}/auth`,
          oauth: `/api/${config.apiVersion}/auth/oauth`,
          users: `/api/${config.apiVersion}/users`,
          health: '/health'
        },
        documentation: 'https://github.com/your-repo/firebase-backend#api-documentation'
      });
    });
  }

  private initializeRoutes(): void {
    const apiRouter = express.Router();

    // Authentication routes (public)
    apiRouter.use('/auth', authRoutes);
    
    // OAuth routes (public and protected)
    apiRouter.use('/auth/oauth', oauthRoutes);

    // Protected routes
    apiRouter.use('/users', authMiddleware, userRoutes);

    // Development/debug routes
    if (config.development.enableDebugRoutes) {
      apiRouter.get('/debug/config', authMiddleware, (req: Request, res: Response) => {
        // Only show non-sensitive config
        const debugConfig = {
          nodeEnv: config.nodeEnv,
          apiVersion: config.apiVersion,
          features: config.features,
          logging: { level: config.logging.level },
          development: config.development
        };
        res.json(debugConfig);
      });

      apiRouter.get('/debug/firebase', authMiddleware, async (req: Request, res: Response) => {
        try {
          const projectId = firebaseConfig.admin.options.projectId;
          res.json({
            projectId,
            connected: true,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          res.status(500).json({
            connected: false,
            error: 'Firebase connection error'
          });
        }
      });
    }

    // Mount API routes
    this.app.use(`/api/${config.apiVersion}`, apiRouter);

    // 404 handler for API routes
    this.app.use('/api/*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: 'The requested API endpoint was not found.',
        path: req.originalUrl
      });
    });
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use(errorHandler);

    // 404 handler for all other routes
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found.',
        path: req.originalUrl
      });
    });
  }

  public listen(): void {
    this.app.listen(config.port, () => {
      logger.info(`Server started on port ${config.port}`, {
        environment: config.nodeEnv,
        apiVersion: config.apiVersion,
        timestamp: new Date().toISOString()
      });
    });
  }

  public getApp(): Application {
    return this.app;
  }
}

// Create and export app instance
const appInstance = new App();

// Start server if this file is run directly
if (require.main === module) {
  appInstance.listen();
}

export default appInstance.getApp();
export { App };