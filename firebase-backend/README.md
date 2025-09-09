# Firebase Backend with Authentication

A comprehensive Node.js backend application built with Firebase, Express.js, and TypeScript, featuring robust authentication, user management, and scalable architecture.

## 🚀 Features

- **Firebase Integration**: Firebase Admin SDK, Authentication, Firestore, Cloud Functions
- **TypeScript**: Full type safety with strict mode enabled
- **Express.js**: RESTful API with comprehensive middleware
- **Authentication**: JWT-based authentication with Firebase Auth
- **User Management**: Complete CRUD operations with role-based access control
- **Security**: Helmet, CORS, rate limiting, input validation
- **Database**: Firestore with security rules and indexes
- **Cloud Functions**: Serverless functions with triggers and scheduled tasks
- **Logging**: Structured logging with Winston
- **Validation**: Joi-based request validation
- **Error Handling**: Centralized error handling with custom error types
- **Testing**: Jest testing framework ready
- **Development**: Hot reload, linting, formatting

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Firebase Setup](#firebase-setup)
- [Development](#development)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase CLI
- Firebase project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd firebase-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase credentials
   ```

4. **Initialize Firebase**
   ```bash
   firebase login
   firebase use <your-project-id>
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

## 📁 Project Structure

```
firebase-backend/
├── src/                          # Source code
│   ├── config/                   # Configuration files
│   │   ├── environment.ts        # Environment variables
│   │   ├── firebase.ts           # Firebase Admin SDK setup
│   │   └── database.ts           # Database configuration
│   ├── controllers/              # Request handlers
│   │   ├── authController.ts     # Authentication endpoints
│   │   ├── userController.ts     # User management endpoints
│   │   └── index.ts              # Controllers index
│   ├── middleware/               # Express middleware
│   │   ├── auth.ts               # Authentication middleware
│   │   ├── validation.ts         # Request validation
│   │   └── errorHandler.ts       # Error handling
│   ├── models/                   # Data models and interfaces
│   │   ├── User.ts               # User model and interfaces
│   │   └── index.ts              # Models index
│   ├── routes/                   # API routes
│   │   ├── auth.ts               # Authentication routes
│   │   ├── users.ts              # User management routes
│   │   └── index.ts              # Routes index
│   ├── services/                 # Business logic
│   │   ├── authService.ts        # Authentication service
│   │   ├── userService.ts        # User management service
│   │   └── firebaseAdmin.ts      # Firebase Admin helpers
│   ├── utils/                    # Utility functions
│   │   ├── logger.ts             # Logging utility
│   │   ├── validators.ts         # Validation helpers
│   │   └── helpers.ts            # General helpers
│   └── app.ts                    # Express application setup
├── functions/                    # Firebase Cloud Functions
│   ├── src/
│   │   └── index.ts              # Cloud Functions entry point
│   ├── package.json              # Functions dependencies
│   └── tsconfig.json             # Functions TypeScript config
├── tests/                        # Test files
├── scripts/                      # Build and utility scripts
├── firebase.json                 # Firebase configuration
├── firestore.rules               # Firestore security rules
├── firestore.indexes.json        # Firestore indexes
├── storage.rules                 # Firebase Storage rules
├── .firebaserc                   # Firebase project settings
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Project dependencies
├── .env.example                  # Environment variables template
└── README.md                     # This file
```

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/

# Server Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://yourdomain.com
```

### Firebase Setup

1. **Create a Firebase project** at https://console.firebase.google.com/

2. **Enable Authentication**
   - Go to Authentication > Sign-in method
   - Enable Email/password provider
   - Configure other providers as needed

3. **Set up Firestore**
   - Go to Firestore Database
   - Create database in production mode
   - Deploy security rules: `firebase deploy --only firestore:rules`

4. **Generate service account key**
   - Go to Project Settings > Service accounts
   - Generate new private key
   - Add credentials to `.env` or save as `src/config/serviceAccountKey.json`

## 📖 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "displayName": "John Doe",
  "phoneNumber": "+1234567890"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### Login with Token
```http
POST /api/v1/auth/login/token
Content-Type: application/json

{
  "idToken": "firebase-id-token"
}
```

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <firebase-id-token>
```

#### Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer <firebase-id-token>
```

### User Management Endpoints

#### Get User Profile
```http
GET /api/v1/users/me
Authorization: Bearer <firebase-id-token>
```

#### Update User Profile
```http
PUT /api/v1/users/me
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "displayName": "Jane Doe",
  "profile": {
    "bio": "Software developer",
    "website": "https://example.com"
  }
}
```

#### List Users (Admin)
```http
GET /api/v1/users?page=1&limit=20&role=user
Authorization: Bearer <admin-token>
```

#### Update User Role (Admin)
```http
PUT /api/v1/users/{userId}/role
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "role": "admin"
}
```

### Response Format

All API responses follow this format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

Error responses:

```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/endpoint"
}
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run dev:watch        # Start with file watching

# Building
npm run build            # Build TypeScript to JavaScript
npm run clean            # Remove build directory

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage

# Code Quality
npm run lint             # Lint TypeScript files
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier
npm run typecheck        # Type checking without building

# Firebase
npm run firebase:serve   # Start Firebase emulators
npm run firebase:deploy  # Deploy to Firebase
npm run functions:build  # Build functions
npm run functions:serve  # Serve functions locally
```

### Development Workflow

1. **Start the development environment**
   ```bash
   npm run dev
   ```

2. **Start Firebase emulators (optional)**
   ```bash
   npm run firebase:serve
   ```

3. **Make changes and test**
   - API will hot-reload on changes
   - Test endpoints with Postman or curl

4. **Run tests**
   ```bash
   npm test
   ```

5. **Check code quality**
   ```bash
   npm run lint
   npm run typecheck
   ```

### Testing

Create test files in the `tests/` directory:

```typescript
// tests/auth.test.ts
import request from 'supertest';
import app from '../src/app';

describe('Authentication', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

## 🚀 Deployment

### Deploy to Firebase Functions

1. **Build the project**
   ```bash
   npm run build
   npm run functions:build
   ```

2. **Deploy**
   ```bash
   firebase deploy
   ```

3. **Deploy specific components**
   ```bash
   firebase deploy --only functions
   firebase deploy --only firestore:rules
   firebase deploy --only hosting
   ```

### Deploy to Other Platforms

#### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/app.js"]
```

#### Environment Variables for Production
Ensure all production environment variables are set:
- Firebase service account credentials
- Production database URLs
- Security keys and secrets
- CORS origins

## 🔒 Security

### Security Features

1. **Authentication & Authorization**
   - Firebase Authentication integration
   - JWT token validation
   - Role-based access control
   - Custom claims for permissions

2. **Request Security**
   - Helmet.js for security headers
   - CORS configuration
   - Rate limiting
   - Input validation and sanitization

3. **Data Security**
   - Firestore security rules
   - Firebase Storage security rules
   - Encrypted sensitive data
   - SQL injection prevention

### Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use different credentials for each environment
   - Rotate secrets regularly

2. **Firebase Security**
   - Keep Firebase Admin SDK credentials secure
   - Use least-privilege access for service accounts
   - Enable Firebase Security Monitoring

3. **API Security**
   - Validate all inputs
   - Use HTTPS in production
   - Implement proper error handling
   - Log security events

## 🏗️ Architecture

### Key Components

1. **Authentication Layer**
   - Firebase Auth integration
   - JWT token management
   - Role-based permissions

2. **API Layer**
   - RESTful endpoints
   - Express.js middleware
   - Request validation
   - Error handling

3. **Business Logic Layer**
   - Service classes
   - Data transformation
   - Business rules

4. **Data Layer**
   - Firestore integration
   - Data models
   - Security rules

5. **Cloud Functions**
   - Authentication triggers
   - Database triggers
   - Scheduled functions
   - HTTP callable functions

### Design Patterns

- **Dependency Injection**: Services are injected into controllers
- **Repository Pattern**: Data access abstraction
- **Middleware Pattern**: Request/response processing
- **Observer Pattern**: Event-driven architecture with Firebase triggers

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Add tests for new functionality**
5. **Run tests and linting**
   ```bash
   npm test
   npm run lint
   ```
6. **Commit your changes**
   ```bash
   git commit -m "Add: your feature description"
   ```
7. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Create a pull request**

### Code Style

- Follow TypeScript best practices
- Use ESLint and Prettier configurations
- Write comprehensive tests
- Document new features
- Follow commit message conventions

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [FAQ](#faq) section
2. Search existing issues on GitHub
3. Create a new issue with detailed description
4. Contact the development team

## FAQ

**Q: How do I reset a user's password?**
A: Use the `/api/v1/auth/reset-password` endpoint with the user's email.

**Q: How do I add custom user roles?**
A: Modify the `UserRole` enum in `src/models/User.ts` and update the permissions in the auth service.

**Q: How do I add new API endpoints?**
A: Create controller methods, add routes, and update the middleware as needed.

**Q: How do I enable social login?**
A: Configure the authentication providers in Firebase Console and update the auth service.

## Changelog

### v1.0.0 (Initial Release)
- Firebase Authentication integration
- User management system
- RESTful API with Express.js
- TypeScript support
- Firestore database integration
- Cloud Functions
- Security middleware
- Comprehensive logging
- Development and deployment setup