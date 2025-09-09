# Firebase Backend Setup Guide

## 🎯 Quick Setup Checklist

Follow these steps to get your Firebase backend up and running:

### 1. Prerequisites ✅
- [ ] Node.js 18+ installed
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Firebase project created at https://console.firebase.google.com
- [ ] Git repository initialized

### 2. Project Setup ✅
```bash
# Navigate to project directory
cd firebase-backend

# Install dependencies
npm install
cd functions && npm install && cd ..

# Copy environment template
cp .env.example .env
```

### 3. Firebase Configuration 🔥
```bash
# Login to Firebase
firebase login

# Initialize Firebase project (if needed)
firebase init

# Set your project
firebase use your-project-id
```

Update `.firebaserc` with your project ID:
```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

### 4. Environment Variables ⚙️
Edit `.env` file with your Firebase credentials:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/

JWT_SECRET=your-secure-jwt-secret-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 5. Firebase Services Setup 🛠️

#### Enable Authentication:
1. Go to Firebase Console → Authentication
2. Enable Email/Password provider
3. Configure other providers as needed (Google, Facebook, etc.)

#### Set up Firestore:
1. Go to Firebase Console → Firestore Database
2. Create database in production mode
3. Deploy security rules: `firebase deploy --only firestore:rules`

#### Configure Storage (optional):
1. Go to Firebase Console → Storage
2. Set up Storage bucket
3. Deploy storage rules: `firebase deploy --only storage`

### 6. Development Server 🚀
```bash
# Start development server
npm run dev

# Start Firebase emulators (optional)
npm run firebase:serve
```

Server runs on: http://localhost:3000
Health check: http://localhost:3000/health

### 7. Test the API 🧪
```bash
# Test registration
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "displayName": "Test User"
  }'

# Test login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 8. Deploy to Production 🚀
```bash
# Build the project
npm run build
npm run functions:build

# Deploy to Firebase
firebase deploy

# Deploy specific components
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage
```

## 🔍 Verification Steps

After setup, verify these components:

### API Endpoints ✅
- [ ] `GET /health` - Returns 200 with health status
- [ ] `POST /api/v1/auth/register` - User registration works
- [ ] `POST /api/v1/auth/login` - User login works
- [ ] `GET /api/v1/auth/me` - Protected route works with token

### Firebase Integration ✅
- [ ] User documents created in Firestore on registration
- [ ] Authentication tokens work correctly
- [ ] Firestore security rules prevent unauthorized access
- [ ] Cloud Functions deploy and trigger correctly

### Development Tools ✅
- [ ] TypeScript compilation works (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Tests run successfully (`npm test`)
- [ ] Hot reload works in development

## 📁 Key Files Overview

```
firebase-backend/
├── src/
│   ├── app.ts                    # Main Express application
│   ├── config/
│   │   ├── firebase.ts           # Firebase Admin SDK setup
│   │   └── environment.ts        # Environment configuration
│   ├── controllers/
│   │   ├── authController.ts     # Authentication endpoints
│   │   └── userController.ts     # User management endpoints
│   ├── middleware/
│   │   ├── auth.ts               # JWT authentication
│   │   ├── validation.ts         # Request validation
│   │   └── errorHandler.ts       # Error handling
│   ├── models/
│   │   └── User.ts               # User data models
│   ├── routes/
│   │   ├── auth.ts               # Auth routes
│   │   └── users.ts              # User routes
│   ├── services/
│   │   ├── authService.ts        # Authentication logic
│   │   └── userService.ts        # User management logic
│   └── utils/
│       ├── logger.ts             # Logging utility
│       └── helpers.ts            # Helper functions
├── functions/
│   └── src/index.ts              # Cloud Functions
├── firebase.json                 # Firebase config
├── firestore.rules               # Database security
└── package.json                  # Dependencies
```

## 🔧 Common Issues & Solutions

### Issue: "Firebase not initialized"
**Solution**: Ensure FIREBASE_PROJECT_ID is set in .env file

### Issue: "Permission denied" in Firestore
**Solution**: Check firestore.rules and ensure user is authenticated

### Issue: "Invalid token" errors
**Solution**: Verify JWT_SECRET is set and tokens are properly formatted

### Issue: CORS errors
**Solution**: Add your domain to ALLOWED_ORIGINS in .env file

### Issue: Functions deployment fails
**Solution**: Run `npm run functions:build` before deploying

## 📞 Support

- **Documentation**: See README.md for detailed documentation
- **API Reference**: Check the API endpoints section in README.md
- **Firebase Docs**: https://firebase.google.com/docs
- **Express.js Docs**: https://expressjs.com/

## 🎉 You're Ready!

Your Firebase backend is now set up with:
- ✅ User authentication and registration
- ✅ JWT token-based security
- ✅ Role-based access control
- ✅ Firestore database integration
- ✅ Cloud Functions with triggers
- ✅ Comprehensive error handling
- ✅ Request validation
- ✅ Structured logging
- ✅ Development and production configurations

Start building your application! 🚀