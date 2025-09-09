# Dragon Worlds HK 2027 Mobile App

[![React Native](https://img.shields.io/badge/React%20Native-0.79.6-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2053-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.13.2-orange.svg)](https://firebase.google.com/)

Official mobile application for the Dragon World Championships 2027 in Hong Kong. Get real-time weather data, race schedules, results, and connect with fellow sailors.

## 🏆 Features

- **Real-time Weather Data**: Live weather conditions, forecasts, and sailing-specific metrics
- **Race Management**: Comprehensive race schedules, results, and live tracking
- **Interactive Maps**: Sailing course visualization with React Native Maps
- **Social Features**: Connect with fellow sailors and share racing moments
- **Push Notifications**: Race alerts, weather warnings, and event updates
- **Calendar Integration**: Add race events directly to your device calendar
- **Offline Support**: Core features work without internet connection
- **Cross-platform**: Native iOS, Android, and web support

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (Mac) or Android Studio/emulator
- Firebase project configured (see [Firebase Setup](#firebase-setup))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/DragonWorldsHK2027.git
cd DragonWorldsHK2027

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration values

# Start development server
npm start
```

### Development Commands

```bash
# Platform-specific development
npm run android     # Start and run on Android
npm run ios         # Start and run on iOS  
npm run web         # Start and run on web

# Testing
npm test            # Run all tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run test:accessibility # Run accessibility tests

# Code Quality
npm run typecheck   # TypeScript type checking
npm run lint        # ESLint code linting

# Building
npm run build:ios       # Build iOS app
npm run build:android   # Build Android app
npm run build:all       # Build for all platforms

# Bundle Analysis
npm run bundle-analyze  # Analyze bundle size
npm run optimize       # Run full optimization suite
```

## 🏗️ Architecture

### Technology Stack

- **Frontend Framework**: React Native 0.79.6 with Expo SDK 53
- **Language**: TypeScript with strict mode
- **Navigation**: React Navigation v7 (Bottom Tabs + Stack)
- **State Management**: Zustand with AsyncStorage persistence
- **Data Fetching**: TanStack React Query for server state
- **Backend**: Firebase (Firestore, Functions, Authentication, Storage)
- **Maps**: React Native Maps for course visualization
- **Notifications**: Expo Notifications
- **Testing**: Jest with React Native Testing Library

### Project Structure

```
DragonWorldsHK2027/
├── src/                    # Main application source code
│   ├── components/         # Reusable UI components
│   ├── screens/           # Screen components
│   ├── navigation/        # Navigation configuration
│   ├── services/          # API and external service integrations
│   ├── stores/           # Zustand state management
│   ├── utils/            # Utility functions and helpers
│   ├── types/            # TypeScript type definitions
│   └── testing/          # Test utilities and setup
├── firebase-backend/      # Firebase backend configuration
│   ├── functions/        # Cloud Functions
│   ├── firestore.rules   # Firestore security rules
│   └── storage.rules     # Firebase Storage rules
├── assets/               # Static assets (icons, images, etc.)
├── scripts/              # Build and deployment scripts
└── docs/                 # Project documentation
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# API Endpoints
EXPO_PUBLIC_API_URL=https://api.dragonworlds.com
EXPO_PUBLIC_WEATHER_API_URL=https://weather-api.dragonworlds.com

# Feature Flags
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_DEVELOPER_MENU=false
```

### Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable the following services:
   - Authentication (Email/Password, Google, Apple)
   - Firestore Database
   - Cloud Storage
   - Cloud Functions
   - Cloud Messaging
3. Configure your Firebase project:
   ```bash
   cd firebase-backend
   npm install -g firebase-tools
   firebase login
   firebase use --add your-project-id
   ```
4. Deploy Firebase backend:
   ```bash
   cd firebase-backend
   npm install
   npm run deploy
   ```

## 📱 Platform Support

### iOS
- **Minimum Version**: iOS 13.0+
- **iPad Support**: Yes
- **Features**: Full feature parity including Apple Sign-In
- **Bundle ID**: `com.dragonworlds.hk2027`

### Android
- **Minimum SDK**: 23 (Android 6.0)
- **Target SDK**: 34 (Android 14)
- **Features**: Full feature parity including Google Sign-In
- **Package**: `com.dragonworlds.hk2027`

### Web
- **Browsers**: Modern browsers with PWA support
- **Features**: Core features with responsive design
- **URL**: `https://app.dragonworlds.com`

## 🧪 Testing

### Test Coverage Requirements
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Running Tests

```bash
# Unit tests
npm test

# Integration tests
npm run test:watch

# Accessibility tests
npm run test:accessibility

# Coverage report
npm run test:coverage
```

### Testing Strategy
- Unit tests for utility functions and business logic
- Component tests using React Native Testing Library
- Integration tests for critical user flows
- Accessibility testing with automated tools
- Manual testing on physical devices

## 🚢 Deployment

### EAS Build & Submit

```bash
# Build for app stores
npm run build:all

# Submit to app stores
npm run submit:ios
npm run submit:android

# Over-the-air updates
npm run update
```

### Environment-specific Builds

```bash
# Development build
eas build --profile development

# Preview build  
eas build --profile preview

# Production build
eas build --profile production
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm run optimize`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- TypeScript with strict mode enabled
- ESLint configuration extends Expo/React Native standards
- Prettier for code formatting
- Conventional commits for commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Full documentation](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/DragonWorldsHK2027/issues)
- **Discord**: [Dragon Worlds Community](https://discord.gg/dragonworlds)
- **Email**: support@dragonworlds.com

## 🙏 Acknowledgments

- International Dragon Association
- Royal Hong Kong Yacht Club
- Weather data providers
- Open source community

---

**Built with ❤️ for the Dragon sailing community**