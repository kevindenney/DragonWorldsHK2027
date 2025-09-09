import winston from 'winston';
import path from 'path';
import { config } from '../config/environment';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (stack) {
      logMessage += `\nStack: ${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      logMessage += `\nMeta: ${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);

// Create logs directory if it doesn't exist
const logDir = path.dirname(config.logging.file);

const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { 
    service: 'firebase-backend',
    environment: config.nodeEnv 
  },
  transports: [
    // File transport for all logs
    new winston.transports.File({
      filename: config.logging.file,
      handleExceptions: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Separate file for errors
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      handleExceptions: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  exitOnError: false
});

// Add console transport for development
if (config.nodeEnv !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, stack }) => {
        let logMessage = `${timestamp} [${level}]: ${message}`;
        if (stack) {
          logMessage += `\n${stack}`;
        }
        return logMessage;
      })
    ),
    handleExceptions: true
  }));
}

// Add performance timing helpers
interface PerformanceTimer {
  start: number;
  label: string;
}

const performanceTimers = new Map<string, PerformanceTimer>();

const loggerWithHelpers = {
  ...logger,
  
  // Performance timing
  startTimer: (label: string): void => {
    performanceTimers.set(label, {
      start: Date.now(),
      label
    });
  },
  
  endTimer: (label: string): void => {
    const timer = performanceTimers.get(label);
    if (timer) {
      const duration = Date.now() - timer.start;
      logger.info(`Performance: ${label} completed in ${duration}ms`);
      performanceTimers.delete(label);
    }
  },
  
  // Structured logging helpers
  logRequest: (req: any, res: any, duration?: number): void => {
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.uid,
      duration: duration ? `${duration}ms` : undefined
    });
  },
  
  logError: (error: Error, context?: any): void => {
    logger.error('Application Error', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context
    });
  },
  
  logAuth: (action: string, userId?: string, email?: string, success: boolean = true): void => {
    logger.info('Authentication Event', {
      action,
      userId,
      email,
      success,
      timestamp: new Date().toISOString()
    });
  },
  
  logDatabase: (operation: string, collection: string, docId?: string, success: boolean = true): void => {
    logger.info('Database Operation', {
      operation,
      collection,
      docId,
      success
    });
  },
  
  logSecurity: (event: string, details: any, level: 'warn' | 'error' = 'warn'): void => {
    logger[level]('Security Event', {
      event,
      details,
      timestamp: new Date().toISOString()
    });
  },
  
  // Development helpers
  logDev: (message: string, data?: any): void => {
    if (config.nodeEnv === 'development') {
      logger.debug('Development Log', { message, data });
    }
  }
};

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error: Error) => {
  loggerWithHelpers.logError(error, { source: 'uncaughtException' });
  process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  loggerWithHelpers.logError(new Error(`Unhandled Rejection: ${reason}`), { 
    source: 'unhandledRejection',
    promise: promise.toString() 
  });
});

export default loggerWithHelpers;