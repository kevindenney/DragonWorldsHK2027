import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { auth, db, analytics } from './firebase';
import { AuthService } from './auth/authService';
import { FirestoreService } from './services/firebaseService';
import { AnalyticsService } from './services/analyticsService';
import { AppError, handleFirebaseError, logError } from './utils/errorHandler';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'DragonWorldsHK2027 Firebase Backend',
    firebase: {
      auth: !!auth,
      firestore: !!db,
      analytics: !!analytics
    }
  });
});

app.get('/api/status', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'DragonWorldsHK2027 Firebase Backend is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN
    }
  });
});

app.post('/api/auth/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, displayName } = req.body;
    
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const userCredential = await AuthService.createUser({ email, password, displayName });
    
    AnalyticsService.logUserRegistration('email');
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName
      }
    });
  } catch (error) {
    next(handleFirebaseError(error));
  }
});

app.post('/api/auth/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const userCredential = await AuthService.signIn({ email, password });
    
    AnalyticsService.logUserLogin('email');
    
    res.status(200).json({
      message: 'Login successful',
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName
      }
    });
  } catch (error) {
    next(handleFirebaseError(error));
  }
});

app.get('/api/data/:collection', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { collection } = req.params;
    const data = await FirestoreService.getCollection(collection);
    
    res.status(200).json({
      collection,
      data,
      count: data.length
    });
  } catch (error) {
    next(handleFirebaseError(error));
  }
});

app.post('/api/data/:collection', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { collection } = req.params;
    const documentData = req.body;
    
    const docRef = await FirestoreService.create(collection, documentData);
    
    res.status(201).json({
      message: 'Document created successfully',
      id: docRef.id,
      collection
    });
  } catch (error) {
    next(handleFirebaseError(error));
  }
});

app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

app.use((error: AppError | Error, req: Request, res: Response, next: NextFunction) => {
  logError(error, `${req.method} ${req.path}`);
  
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
      statusCode: error.statusCode
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    statusCode: 500
  });
});

app.listen(PORT, () => {
  console.log(`🚀 DragonWorldsHK2027 Firebase Backend running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔥 Firebase Project: ${process.env.FIREBASE_PROJECT_ID}`);
  console.log(`🏁 Health check: http://localhost:${PORT}/health`);
  
  AnalyticsService.logCustomEvent('server_start', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

export default app;