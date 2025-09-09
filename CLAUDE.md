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