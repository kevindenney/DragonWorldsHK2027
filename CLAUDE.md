# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native mobile application built with Expo called "DragonWorldsHK2027". It's a cross-platform app targeting iOS, Android, and web platforms.

## Technology Stack

- **Framework**: React Native with Expo (~53.0.22)
- **Runtime**: React 19.0.0, React Native 0.79.6
- **Language**: TypeScript with strict mode enabled
- **Architecture**: Expo's new architecture enabled (`newArchEnabled: true`)
- **Navigation**: React Navigation (v7) with bottom tabs and stack navigation
- **State Management**: Zustand with persistent storage via AsyncStorage
- **Data Fetching**: TanStack React Query for server state management
- **Maps**: React Native Maps for sailing course visualization
- **Notifications**: Expo Notifications for race alerts and updates
- **Icons**: Lucide React Native and Expo Vector Icons

## Development Commands

### Start Development Server
```bash
npm start           # Start Expo development server
npm run android     # Start and run on Android
npm run ios         # Start and run on iOS  
npm run web         # Start and run on web
```

### Project Structure

- `App.tsx` - Main application component (entry point for UI)
- `index.ts` - Application registration with Expo
- `app.json` - Expo configuration file
- `assets/` - Application icons, splash screens, and static assets
- `tsconfig.json` - TypeScript configuration extending Expo base

## Key Configuration Details

- **Orientation**: Portrait mode only
- **UI Style**: Light mode
- **Platform Support**: iOS (with tablet support), Android (with edge-to-edge and adaptive icons), Web
- **TypeScript**: Strict mode enabled for type safety
- **Package Manager**: npm (package-lock.json present)

## Architecture Notes

The app follows standard Expo/React Native patterns:
- Single main App component rendered through Expo's registerRootComponent
- StyleSheet-based styling approach
- Expo StatusBar component for status bar management
- Standard Expo asset organization in `/assets` folder

## Expo Go Development Guidelines

**CRITICAL**: This project is designed to maintain full compatibility with Expo Go. All development must follow these guidelines to ensure the app works without requiring development builds.

### Package Management Rules

- **ALWAYS** use `npx expo install <package>` instead of `npm install` for Expo-managed packages
- **NEVER** install packages that require custom native code or development builds
- **CHECK** package compatibility with Expo Go before installation using [Expo SDK documentation](https://docs.expo.dev/versions/latest/)
- **FORBIDDEN** package types:
  - Native modules requiring linking
  - Packages with Android/iOS platform-specific code
  - Libraries requiring custom Babel plugins for native functionality

### Animation & UI Guidelines

- **ALWAYS** use `src/utils/reanimatedWrapper` for animations (never direct `react-native-reanimated`)
- **PREFER** React Native's built-in `Animated` API for complex animations
- **USE** CSS transforms and opacity changes for simple transitions
- **TEST** all animations in Expo Go before considering alternatives
- **DOCUMENT** any custom animation solutions in wrapper files

### Feature Development Constraints

- **ALL** new features MUST work in Expo Go (test early and often)
- **USE** Expo SDK APIs whenever possible:
  - `expo-camera` instead of react-native-camera
  - `expo-notifications` instead of push notification libraries
  - `expo-location` instead of react-native-geolocation
  - `expo-maps` or react-native-maps (Expo compatible)
- **AVOID** direct native module imports or platform-specific code
- **PREFER** web-compatible solutions for broader compatibility

### Configuration Management

- **KEEP** `newArchEnabled: false` in app.json (Expo Go compatibility)
- **NEVER** add Babel plugins that require development builds
- **ENSURE** all configuration changes are Expo Go compatible
- **USE** Expo config plugins only when absolutely necessary and Expo Go compatible

### Development Workflow

1. **TEST** every feature in Expo Go first before considering alternatives
2. **USE** web preview (`npx expo start --web`) for rapid iteration and debugging
3. **DOCUMENT** any Expo Go limitations or workarounds discovered
4. **ESCALATE** to development builds only when Expo Go limitations are confirmed and unavoidable

### Code Review Checklist

Before merging any code, verify:
- ✅ Does this work in Expo Go?
- ✅ Are we using Expo SDK equivalents where available?
- ✅ Will this require a development build?
- ✅ Is there an Expo-compatible alternative?
- ✅ Have we tested on both iOS and Android in Expo Go?

### Package Installation Process

1. **CHECK** if the package is in the Expo SDK
2. **SEARCH** for "expo-" prefixed alternatives
3. **VERIFY** compatibility with Expo Go
4. **TEST** in a separate branch before merging
5. **DOCUMENT** any compatibility solutions or wrappers needed

### Common Compatibility Solutions

- **Animations**: Use `src/utils/reanimatedWrapper` (React Native Animated API fallbacks)
- **Native Features**: Always check for Expo SDK equivalents first
- **Platform-specific Code**: Use Expo's platform detection and APIs
- **Background Tasks**: Use Expo TaskManager instead of native background processing
- **File System**: Use Expo FileSystem instead of react-native-fs

### Emergency Procedures

If Expo Go compatibility is broken:
1. **IMMEDIATELY** revert the breaking change
2. **ANALYZE** what caused the incompatibility
3. **SEARCH** for Expo-compatible alternatives
4. **CREATE** custom wrappers if necessary (following reanimatedWrapper pattern)
5. **DOCUMENT** the solution for future reference

### Migration Notes

- **react-native-reanimated**: Removed due to New Architecture + Hermes conflicts in Expo Go
- **Custom animations**: Use `src/utils/reanimatedWrapper` which provides React Native Animated API fallbacks
- **Native modules**: Replaced with Expo SDK equivalents where possible