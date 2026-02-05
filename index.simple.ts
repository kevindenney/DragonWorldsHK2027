// Dragon Worlds HK 2027 - Simplified React Native Entry Point
console.log('🏁 [index.ts] Initializing Dragon Worlds HK 2027 app');

// Type declarations for React Native global polyfills
declare const global: typeof globalThis & {
  distance?: number;
  document?: any;
  window?: any;
  navigator?: any;
  ErrorUtils?: {
    getGlobalHandler?: () => ((error: Error, isFatal?: boolean) => void) | undefined;
    setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
  };
};

// HERMES-SAFE: Minimal polyfills without property descriptor manipulation
console.log('🌐 [index.ts] Installing minimal React Native polyfills...');

// Simple global distance fallback for deriveBFS protection (no complex property descriptors)
if (typeof global !== 'undefined' && typeof global.distance === 'undefined') {
  console.log('🔧 [index.ts] Adding simple distance fallback');
  try {
    global.distance = 0;
  } catch (error) {
    console.log('🔧 [index.ts] Distance property assignment failed (already protected)');
  }
}

// Simple DOM polyfills without complex descriptor manipulation
if (typeof global !== 'undefined') {
  if (typeof global.document === 'undefined') {
    console.log('🔧 [index.ts] Installing simple document polyfill');
    global.document = {
      createElement: (tag: string) => ({ tagName: tag.toUpperCase(), style: {} }),
      getElementById: () => null,
      querySelector: () => null,
      addEventListener: () => {},
      body: { style: {} },
      head: { style: {} },
      location: { href: 'react-native://localhost' }
    };
  }

  if (typeof global.window === 'undefined') {
    console.log('🔧 [index.ts] Installing simple window polyfill');
    global.window = global;
    global.window.navigator = { userAgent: 'React Native' };
  }

  if (typeof global.navigator === 'undefined') {
    console.log('🔧 [index.ts] Installing simple navigator polyfill');
    global.navigator = { userAgent: 'React Native', platform: 'react-native' };
  }
}

// Simple error handler for property errors (no complex overrides)
const originalErrorHandler = global.ErrorUtils?.getGlobalHandler?.();
global.ErrorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
  // Handle the specific runtime property error
  if (error.message?.includes('[runtime not ready]: TypeError: property is not configurable')) {
    console.warn('🛡️ [PropertyGuard] Runtime property error intercepted and suppressed');
    return; // Don't propagate this error
  }

  // Handle Firebase property configurability errors
  if (error.message?.includes('property is not configurable') ||
      error.message?.includes('Attempting to change the getter')) {
    console.warn('🛡️ [PropertyGuard] Property configurability error suppressed');
    return; // Don't propagate this error
  }

  // Pass all other errors to original handler
  originalErrorHandler?.(error, isFatal);
});

console.log('📦 [index.ts] Starting imports...');

import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import App from './App';

console.log('✅ [index.ts] All imports completed');
console.log('📱 [index.ts] Registering root component...');

registerRootComponent(App);

console.log('✅ [index.ts] App registered successfully with minimal protection');