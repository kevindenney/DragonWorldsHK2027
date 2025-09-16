/*
 * SHARED COMPONENTS INDEX - BARREL EXPORTS DISABLED
 *
 * ⚠️  CRITICAL: Barrel exports cause property descriptor conflicts with Hermes engine
 *
 * Error: "TypeError: property is not configurable, js engine: hermes"
 * Root Cause: export * from './Component' patterns conflict with Hermes module resolution
 * Solution: Use direct imports instead of barrel exports
 *
 * BEFORE (Broken):
 * import { ErrorBoundary, LoadingSpinner } from '../components/shared';
 *
 * AFTER (Working):
 * import { ErrorBoundary } from '../components/shared/ErrorBoundary';
 * import { LoadingSpinner } from '../components/shared/LoadingSpinner';
 *
 * Files using direct imports:
 * - src/screens/tabs/UnifiedRaceScreen.tsx
 * - src/screens/tabs/NoticesScreen.tsx
 * - src/screens/NoticeBoardScreen.tsx
 *
 * See CLAUDE.md "Known Issues & Solutions" for full documentation.
 */

// All barrel exports disabled due to Hermes engine incompatibility
// export * from './LoadingSpinner';
// export * from './ErrorBoundary';
// export * from './OfflineError';
// export * from './SimpleError';
// export * from './SkeletonLoader';

// Available components (import directly from their files):
// - ErrorBoundary: Error handling wrapper component
// - LoadingSpinner: Loading state indicator
// - OfflineError: Offline connectivity error display
// - SimpleError: Basic error message component
// - SkeletonLoader: Loading placeholder animations