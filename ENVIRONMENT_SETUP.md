# 🔒 Environment Variables Setup Guide

This guide explains how to securely configure environment variables for the Dragon Worlds HK 2027 app.

## 📋 Overview

The app uses environment variables to securely store sensitive configuration like Firebase keys, API endpoints, and OAuth credentials. This approach keeps secrets out of your source code and allows different configurations for development, staging, and production.

## 🔧 Local Development Setup

### 1. Copy the Example File
```bash
cp .env.example .env
```

### 2. Update the .env File
Edit `.env` with your actual configuration values:

```bash
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-actual-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcd1234
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Backend API Configuration
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
EXPO_PUBLIC_API_VERSION=v1

# OAuth Configuration (get from Firebase Console)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-google-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-google-android-client-id.apps.googleusercontent.com

# Environment
EXPO_PUBLIC_NODE_ENV=development
EXPO_PUBLIC_DEBUG_MODE=true
```

### 3. Restart Development Server
```bash
npm start
```

## 🚀 Production Deployment

### Expo Application Services (EAS)

#### 1. Install EAS CLI
```bash
npm install -g @expo/eas-cli
eas login
```

#### 2. Configure EAS Secrets
```bash
# Set Firebase configuration
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your-production-api-key"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "your-project.firebaseapp.com"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "your-project-id"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "your-project.firebasestorage.app"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "123456789"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value "1:123456789:web:abcd1234"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID --value "G-XXXXXXXXXX"

# Set backend configuration
eas secret:create --scope project --name EXPO_PUBLIC_BACKEND_URL --value "https://api.dragonworldshk2027.com"
eas secret:create --scope project --name EXPO_PUBLIC_API_VERSION --value "v1"

# Set OAuth configuration
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "your-google-web-client-id.apps.googleusercontent.com"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value "your-google-ios-client-id.apps.googleusercontent.com"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "your-google-android-client-id.apps.googleusercontent.com"

# Set environment
eas secret:create --scope project --name EXPO_PUBLIC_NODE_ENV --value "production"
eas secret:create --scope project --name EXPO_PUBLIC_DEBUG_MODE --value "false"
```

#### 3. Build for Production
```bash
eas build --platform all --profile production
```

### Other Hosting Services

#### Vercel
Create environment variables in your Vercel dashboard or use the CLI:

```bash
vercel env add EXPO_PUBLIC_FIREBASE_API_KEY production
vercel env add EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN production
# ... repeat for all variables
```

#### Netlify
Add environment variables in your Netlify site settings or use `netlify.toml`:

```toml
[build.environment]
  EXPO_PUBLIC_FIREBASE_API_KEY = "your-api-key"
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = "your-project.firebaseapp.com"
  # ... etc
```

#### GitHub Actions
Add secrets to your repository settings, then use in workflows:

```yaml
env:
  EXPO_PUBLIC_FIREBASE_API_KEY: ${{ secrets.EXPO_PUBLIC_FIREBASE_API_KEY }}
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN }}
  # ... etc
```

## 🔍 Environment-Specific Configurations

### Development
```bash
EXPO_PUBLIC_NODE_ENV=development
EXPO_PUBLIC_DEBUG_MODE=true
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
```

### Staging
```bash
EXPO_PUBLIC_NODE_ENV=staging
EXPO_PUBLIC_DEBUG_MODE=false
EXPO_PUBLIC_BACKEND_URL=https://staging-api.dragonworldshk2027.com
```

### Production
```bash
EXPO_PUBLIC_NODE_ENV=production
EXPO_PUBLIC_DEBUG_MODE=false
EXPO_PUBLIC_BACKEND_URL=https://api.dragonworldshk2027.com
```

## 🛡️ Security Best Practices

### ✅ DO:
- Use `EXPO_PUBLIC_` prefix for client-side variables
- Keep `.env` files in `.gitignore`
- Use different Firebase projects for different environments
- Rotate API keys regularly
- Use Firebase Security Rules to restrict access
- Monitor Firebase usage in console

### ❌ DON'T:
- Commit `.env` files to version control
- Share environment files via email/chat
- Use production keys in development
- Store sensitive server-only secrets in `EXPO_PUBLIC_` variables
- Use the same Firebase project for dev and production

## 🔧 Firebase Console Setup

### 1. Create Projects
- Development: `dragonworldshk2027-dev`
- Staging: `dragonworldshk2027-staging` 
- Production: `dragonworldshk2027`

### 2. Enable Authentication
- Go to Authentication → Sign-in method
- Enable Email/Password, Google, Apple, Facebook
- Configure authorized domains

### 3. Configure OAuth
- Google: Set up in Google Cloud Console
- Apple: Set up in Apple Developer Console
- Facebook: Set up in Facebook Developer Console

### 4. Set up Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public data (events, schedules, etc.)
    match /events/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && 
                   resource.data.role in ['admin', 'organizer'];
    }
  }
}
```

## 🚨 Troubleshooting

### Common Issues

**Environment variables not loading:**
```bash
# Restart the development server
npm start -- --clear

# Check if variables are defined
console.log(process.env.EXPO_PUBLIC_FIREBASE_API_KEY);
```

**Firebase initialization errors:**
```bash
# Verify all required variables are set
# Check Firebase console for project configuration
# Ensure domain is added to authorized domains
```

**Build failures:**
```bash
# Clear Expo cache
npx expo start --clear

# Check EAS secrets are set correctly
eas secret:list
```

## 📞 Support

If you encounter issues with environment setup:

1. Check this documentation
2. Verify all environment variables are correctly set
3. Check Firebase console configuration
4. Contact the development team

---

**⚠️ Remember: Never commit actual API keys or sensitive data to version control!**