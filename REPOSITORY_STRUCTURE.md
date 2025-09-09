# Repository Structure Documentation

This document provides a detailed overview of the DragonWorldsHK2027 repository structure and organization.

## 📁 Root Directory

```
DragonWorldsHK2027/
├── README.md                    # Main project documentation
├── package.json                 # Node.js dependencies and scripts
├── package-lock.json           # Exact dependency versions
├── tsconfig.json               # TypeScript configuration
├── app.json                    # Expo configuration
├── eas.json                    # EAS Build configuration
├── metro.config.js             # Metro bundler configuration
├── index.ts                    # Application entry point
├── App.tsx                     # Main React component
├── .gitignore                  # Git ignore patterns
├── .env.example                # Environment variables template
└── CLAUDE.md                   # AI assistant instructions
```

## 🎯 Source Code (`src/`)

The main application source code is organized into logical modules:

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI primitives (Button, Input, etc.)
│   ├── forms/          # Form-specific components
│   ├── navigation/     # Navigation-related components
│   └── weather/        # Weather display components
│
├── screens/            # Screen components (page-level)
│   ├── auth/          # Authentication screens
│   ├── weather/       # Weather-related screens
│   ├── races/         # Race management screens
│   ├── profile/       # User profile screens
│   └── settings/      # App settings screens
│
├── navigation/         # Navigation configuration
│   ├── AppNavigator.tsx      # Main navigation stack
│   ├── AuthNavigator.tsx     # Authentication flow
│   └── TabNavigator.tsx      # Bottom tab navigation
│
├── services/          # External service integrations
│   ├── firebase/      # Firebase service layer
│   ├── weather/       # Weather API integration
│   ├── notifications/ # Push notification handling
│   └── analytics/     # Analytics service
│
├── stores/            # Zustand state management
│   ├── authStore.ts   # Authentication state
│   ├── weatherStore.ts # Weather data state
│   ├── raceStore.ts   # Race data state
│   └── settingsStore.ts # App settings state
│
├── utils/             # Utility functions and helpers
│   ├── validation.ts  # Form validation helpers
│   ├── formatting.ts  # Data formatting utilities
│   ├── constants.ts   # Application constants
│   └── permissions.ts # Device permission handling
│
├── types/             # TypeScript type definitions
│   ├── api.ts         # API response types
│   ├── navigation.ts  # Navigation parameter types
│   ├── weather.ts     # Weather data types
│   └── race.ts        # Race data types
│
├── hooks/             # Custom React hooks
│   ├── useAuth.ts     # Authentication hook
│   ├── useWeather.ts  # Weather data hook
│   └── usePermissions.ts # Device permissions hook
│
└── testing/           # Test utilities and setup
    ├── setupTests.ts  # Jest configuration
    ├── mocks/         # Mock implementations
    └── fixtures/      # Test data fixtures
```

## 🔥 Firebase Backend (`firebase-backend/`)

Firebase Cloud Functions, Firestore rules, and backend configuration:

```
firebase-backend/
├── README.md              # Firebase backend documentation
├── SETUP_GUIDE.md         # Firebase setup instructions
├── package.json           # Node.js dependencies for functions
├── tsconfig.json          # TypeScript config for functions
├── firebase.json          # Firebase project configuration
├── .firebaserc            # Firebase project aliases
├── firestore.rules        # Firestore security rules
├── firestore.indexes.json # Firestore database indexes
├── storage.rules          # Firebase Storage security rules
│
├── functions/             # Cloud Functions source code
│   ├── src/
│   │   ├── index.ts      # Main functions export
│   │   ├── auth/         # Authentication functions
│   │   ├── weather/      # Weather data functions
│   │   ├── races/        # Race management functions
│   │   └── notifications/ # Push notification functions
│   └── package.json      # Functions dependencies
│
├── src/                   # Backend utilities and services
│   ├── services/         # Service implementations
│   ├── utils/            # Utility functions
│   └── types/            # Backend type definitions
│
└── scripts/              # Deployment and maintenance scripts
    ├── deploy.sh         # Deployment script
    └── backup.sh         # Database backup script
```

## 📱 Assets (`assets/`)

Application assets organized by type and platform:

```
assets/
├── icon.png              # App icon (1024x1024)
├── favicon.png           # Web favicon
├── splash-icon.png       # Splash screen icon
├── adaptive-icon.png     # Android adaptive icon foreground
├── adaptive-background.png # Android adaptive icon background
├── notification-icon.png # Push notification icon
│
├── images/               # Application images
│   ├── logos/           # Brand logos and variations
│   ├── illustrations/   # UI illustrations
│   └── backgrounds/     # Background images
│
└── fonts/               # Custom font files (if any)
```

## 🔧 Configuration Files

### Development Configuration
- **`.env.example`**: Environment variables template with documentation
- **`tsconfig.json`**: TypeScript compiler configuration with strict mode
- **`metro.config.js`**: Metro bundler configuration for React Native
- **`.eslintrc.js`**: ESLint configuration for code quality
- **`.prettierrc`**: Prettier configuration for code formatting

### Build Configuration
- **`app.json`**: Expo configuration for all platforms
- **`eas.json`**: EAS Build profiles (development, preview, production)
- **`package.json`**: npm scripts for development, building, and testing

### Firebase Configuration
- **`firebase.json`**: Firebase services configuration
- **`.firebaserc`**: Firebase project aliases and environments
- **`firestore.rules`**: Database security rules
- **`storage.rules`**: File storage security rules

## 📚 Documentation (`docs/`)

Project documentation organized by topic:

```
docs/
├── API.md                 # API documentation
├── DEPLOYMENT.md          # Deployment guide
├── TESTING.md             # Testing strategy and guidelines
├── SECURITY.md            # Security considerations
├── PERFORMANCE.md         # Performance optimization guide
└── TROUBLESHOOTING.md     # Common issues and solutions
```

## 🚀 Scripts (`scripts/`)

Build, deployment, and maintenance scripts:

```
scripts/
├── build.sh               # Production build script
├── deploy.sh              # Deployment automation
├── prepare-submission.sh  # App store submission prep
├── post-build-validation.sh # Build validation
├── analyze-bundle.js      # Bundle size analysis
├── testMonetizationFeatures.ts # Monetization testing
└── deploymentReadinessCheck.ts # Pre-deployment checks
```

## 🔄 Development Workflow

### Branch Structure
- **`main`**: Production-ready code
- **`develop`**: Development integration branch
- **`feature/*`**: Feature development branches
- **`hotfix/*`**: Critical bug fixes
- **`release/*`**: Release preparation branches

### File Naming Conventions
- **Components**: PascalCase (e.g., `WeatherCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useWeather.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)
- **Types**: PascalCase with descriptive names (e.g., `WeatherData.ts`)

### Import Organization
```typescript
// 1. React and React Native imports
import React from 'react';
import { View, Text } from 'react-native';

// 2. Third-party library imports
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

// 3. Internal imports (absolute paths)
import { WeatherService } from '@/services/weather';
import { useWeatherStore } from '@/stores/weatherStore';
import { WeatherData } from '@/types/weather';

// 4. Relative imports
import './WeatherCard.styles';
```

## 🧪 Testing Structure

Tests are co-located with source files using the following patterns:
- **Unit tests**: `*.test.ts` or `*.test.tsx`
- **Integration tests**: `*.integration.test.ts`
- **E2E tests**: `e2e/` directory (if applicable)

## 📦 Build Outputs

Generated directories (ignored by git):
- **`node_modules/`**: npm dependencies
- **`.expo/`**: Expo development cache
- **`dist/`**: Web build output
- **`web-build/`**: Expo web build
- **`coverage/`**: Test coverage reports

## 🔒 Security Considerations

- Environment variables are stored in `.env` (gitignored)
- Firebase service account keys are never committed
- API keys are properly scoped and rotated regularly
- Security rules are tested and validated before deployment

## 📈 Monitoring and Analytics

- **Sentry**: Error monitoring and performance tracking
- **Firebase Analytics**: User behavior and app usage
- **Custom metrics**: Business-specific analytics

This structure promotes:
- **Scalability**: Clear separation of concerns
- **Maintainability**: Consistent organization patterns
- **Testability**: Easy-to-test modular components
- **Developer Experience**: Intuitive navigation and imports
- **Team Collaboration**: Clear ownership and responsibility boundaries