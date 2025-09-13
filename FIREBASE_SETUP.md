# Firebase & Emulator Setup Guide

Complete setup guide for Firebase and Firebase Emulators for DragonWorldsHK2027 development.

## Quick Start

```bash
# Install and setup everything
npm run dev:setup

# Start emulators with test data
npm run dev

# Check emulator health
npm run emulator:health

# Seed test data
npm run emulator:seed
```

## Prerequisites

- **Node.js 18+**: Required for Firebase CLI and emulators
- **Java 11+**: Required for Firestore emulator
- **Firebase CLI**: Will be installed by setup script

## Environment Configuration

### 1. Copy Environment Template
```bash
cp .env.emulator .env.local
```

### 2. Update Firebase Project Settings
Edit `.env.local` and replace with your actual Firebase project details:

```env
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-actual-project-id
EXPO_PUBLIC_FIREBASE_API_KEY=your-actual-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
# ... etc
```

For emulator-only development, you can use the demo project settings in `.env.emulator`.

## Available Scripts

### Emulator Management
- `npm run emulator:start` - Start all emulators
- `npm run emulator:start:import` - Start emulators with saved data
- `npm run emulator:export` - Export current emulator data
- `npm run emulator:kill` - Kill all emulator processes
- `npm run emulator:health` - Check emulator status
- `npm run emulator:seed` - Populate emulators with test data

### Development Workflows
- `npm run dev` - Start development environment (emulators + saved data)
- `npm run dev:fresh` - Start fresh development environment
- `npm run dev:setup` - Complete setup script

### Testing
- `npm run test:firebase` - Run all Firebase tests
- `npm run test:rules` - Test Firestore security rules
- `npm run test:integration` - Test emulator integration

## Firebase Services Configuration

### 📊 Emulator Ports
- **Emulator UI**: http://localhost:4000
- **Authentication**: http://localhost:9099
- **Firestore**: http://localhost:8080
- **Functions**: http://localhost:5001
- **Hosting**: http://localhost:5000
- **Storage**: http://localhost:9199

### 🔐 Authentication
- Email/password authentication enabled
- Google Sign-In (disabled in dev)
- Apple Sign-In (disabled in dev)
- Custom user roles and permissions

### 🗄️ Firestore Collections
- `users` - User profiles and settings
- `races` - Race information and schedules
- `results` - Race results and standings
- `teams` - Team information
- `events` - Event data
- `notifications` - System notifications
- `socialPosts` - Social media posts
- `user_activity` - User activity logs
- `user_sessions` - Session tracking
- `user_notifications` - User-specific notifications
- `regatta_participants` - Race registrations
- `weather_favorites` - Saved weather locations
- `user_subscriptions` - User subscription data

### ☁️ Cloud Functions
- User lifecycle triggers (create/delete)
- Profile update handlers
- Scheduled cleanup tasks
- Role assignment functions
- Welcome email system

### 📁 Storage Structure
- `users/{userId}/profile/` - Profile images
- `users/{userId}/documents/` - User documents
- `races/{raceId}/media/` - Race photos/videos
- `teams/{teamId}/images/` - Team logos
- `events/{eventId}/media/` - Event media
- `social/{postId}/media/` - Social post media
- `public/` - Public assets

## Test Data

The emulator comes with pre-seeded test data:

### Test Accounts
- **User 1**: `sailor1@example.com` / `password123`
- **User 2**: `sailor2@example.com` / `password123`
- **Admin**: `admin@dragonworldshk.com` / `admin123`

### Sample Data
- 2 sample races
- User profiles with sailing history
- Activity logs
- Social posts

## Security Rules

### Firestore Rules
- **Users**: Can read/write own data, admins can access all
- **Races**: Public read, admin write
- **Activities**: Users can read own, admins read all
- **Social Posts**: Public read, authenticated write, author/admin edit
- **Notifications**: User-specific access

### Storage Rules
- **Profile Images**: User owns, admin access
- **Race Media**: Public read, admin write
- **Documents**: Owner and admin access
- File type and size restrictions enforced

## Development Workflow

### 1. Initial Setup
```bash
npm run dev:setup
```

### 2. Start Development
```bash
# Start with existing data
npm run dev

# OR start fresh
npm run dev:fresh
```

### 3. Access Emulator UI
Open http://localhost:4000 to:
- View Firestore data
- Manage authentication users
- Monitor Cloud Functions
- Browse storage files

### 4. Seed Test Data
```bash
npm run emulator:seed
```

### 5. Test Your Changes
```bash
npm run test:firebase
```

### 6. Export Data (Optional)
```bash
npm run emulator:export
```

## Troubleshooting

### Emulators Won't Start
1. Check Java installation: `java -version`
2. Kill existing processes: `npm run emulator:kill`
3. Check port availability: `lsof -i :4000,:5000,:5001,:8080,:9099,:9199`

### Firestore Rules Errors
1. Test rules: `npm run test:rules`
2. Check emulator logs in terminal
3. Verify custom claims in Auth emulator

### Functions Not Working
1. Check Functions emulator logs
2. Verify Node.js version in `firebase-backend/functions/package.json`
3. Reinstall functions dependencies:
   ```bash
   cd firebase-backend/functions
   npm install
   cd ../..
   ```

### Authentication Issues
1. Verify emulator connections in `src/config/firebase.ts`
2. Check Auth emulator UI for user accounts
3. Clear browser local storage

### Performance Issues
1. Monitor emulator UI for large collections
2. Check Firestore indexes in `firestore.indexes.json`
3. Reduce test data size

## Production Deployment

### 1. Update Environment
Replace `.env.local` with production Firebase config:
```env
EXPO_PUBLIC_NODE_ENV=production
EXPO_PUBLIC_DEBUG_MODE=false
EXPO_PUBLIC_EMULATOR_HOST=# Remove this line
```

### 2. Deploy Functions
```bash
cd firebase-backend/functions
npm run deploy
```

### 3. Deploy Rules
```bash
firebase deploy --only firestore:rules,storage
```

### 4. Deploy Indexes
```bash
firebase deploy --only firestore:indexes
```

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Cloud Functions for Firebase](https://firebase.google.com/docs/functions)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review emulator logs in terminal
3. Test with fresh emulator data: `npm run dev:fresh`
4. Verify all dependencies are installed: `npm install`