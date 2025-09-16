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

## JavaScript Engine & Animation Architecture

### JavaScript Engine: Hermes (Production Choice)
- **Engine**: Hermes for optimal performance and production stability
- **Configuration**: `app.config.js` enforces Hermes engine (`jsEngine: 'hermes'`, `hermes: true`)
- **Decision Context**: After extensive testing, JSC engine showed identical property descriptor conflicts, confirming the issue was framework-level rather than engine-specific
- **Known Issues**: "property is not configurable" error exists in both Hermes and JSC - this is a React Native/Expo framework limitation, not an engine issue
- **Resolution**: Accept error as cosmetic framework limitation; app functionality is unaffected

### Animation Strategy: Wrapper-Based Approach
- **Implementation**: Custom `src/utils/reanimatedWrapper.ts` using React Native's built-in Animated API
- **Package Status**: `react-native-reanimated` 3.17.4 installed but not directly used
- **Import Strategy**: All 35+ components use wrapper imports (`from '../utils/reanimatedWrapper'`) instead of direct reanimated imports
- **Benefits**:
  - ✅ Hermes compatibility without property descriptor conflicts
  - ✅ Expo Go compatibility maintained
  - ✅ Stable animation performance using React Native core APIs
  - ✅ No breaking changes to existing animations
- **Trade-offs**: Does not provide hardware-accelerated animations like native Reanimated, but sufficient for current app needs

### Animation Architecture Guidelines
- **Current Approach**: Continue using `reanimatedWrapper.ts` for all animations
- **Future Considerations**: Selective real Reanimated integration possible for performance-critical animations if needed
- **Component Strategy**: 35+ files successfully using wrapper approach with no issues
- **Testing**: Proven stable across both Hermes and JSC engines

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
- ⚠️ **CRITICAL**: Are we using direct imports instead of barrel exports?
- ⚠️ **NO** barrel exports (`export * from './Component'`) allowed due to Hermes conflicts

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

## Known Issues & Solutions

### CRITICAL: Barrel Export + Hermes Engine Incompatibility

**Issue**: Barrel export patterns (`export * from './Component'`) cause property descriptor conflicts with Hermes JavaScript engine in Expo React Native applications.

**Error Signature**:
```
ERROR  TypeError: property is not configurable, js engine: hermes
```

**Root Cause Discovery**:
- Issue persists across both Hermes and JSC engines, indicating framework-level problem
- Systematic component isolation revealed barrel exports as the culprit, not individual components
- Error message is misleading - it's actually about module resolution conflicts, not property configuration

**Solution**: Replace all barrel exports with direct imports

**Before (Causes Error)**:
```typescript
// src/components/shared/index.ts
export * from './LoadingSpinner';
export * from './ErrorBoundary';
export * from './OfflineError';
export * from './SimpleError';
export * from './SkeletonLoader';

// Consumer file
import { ErrorBoundary, LoadingSpinner } from '../components/shared';
```

**After (Works Correctly)**:
```typescript
// src/components/shared/index.ts
// All barrel exports disabled due to Hermes engine incompatibility

// Consumer file
import { ErrorBoundary } from '../components/shared/ErrorBoundary';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
```

**Files Updated**:
- `/src/components/shared/index.ts` - All exports commented out with documentation
- `/src/screens/tabs/UnifiedRaceScreen.tsx` - Direct imports implemented
- `/src/screens/tabs/NoticesScreen.tsx` - Direct imports implemented
- `/src/screens/NoticeBoardScreen.tsx` - Direct imports implemented

**Development Guidelines**:
- ❌ **NEVER** use barrel exports (`export * from`) in Expo + Hermes projects
- ✅ **ALWAYS** use direct imports from specific component files
- ✅ **TEST** thoroughly after removing barrel exports to ensure functionality
- ✅ **DOCUMENT** any barrel export removal as a Hermes compatibility fix

**Debugging Methodology**:
If encountering "property is not configurable" errors:
1. Systematically disable barrel exports one by one
2. Update consuming files to use direct imports
3. Test after each change to isolate the specific cause
4. The error will disappear once ALL barrel exports are removed
5. Document the specific files and patterns that caused issues

**Impact**: This fix resolved 2+ days of debugging and restored full app functionality. The app now works correctly in both development and production builds.

**Additional Notes**:
- 15+ other barrel export files exist throughout the codebase (`src/components/index.ts`, `src/services/index.ts`, etc.)
- The property descriptor error may still appear in logs from these remaining exports
- However, app functionality is fully restored - the critical shared components fix was sufficient
- Future optimization: systematically replace all barrel exports with direct imports for complete error elimination