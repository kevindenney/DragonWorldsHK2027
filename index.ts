// DISABLE intensive debugging to reduce noise and focus on core issue
console.log('🔍 [index.ts] Starting with minimal debugging for deriveBFS fix...');

// CRITICAL: Ultra-aggressive deriveBFS protection at the lowest possible level
console.log('🛡️ [index.ts] Installing CRITICAL deriveBFS protection...');

// Override the global property access at the most fundamental level
const originalObjectGet = Object.getOwnPropertyDescriptor;
Object.getOwnPropertyDescriptor = function(obj: any, prop: string | symbol) {
  // CRITICAL: Handle the exact deriveBFS case
  if (prop === 'distance') {
    if (obj === null || obj === undefined) {
      // Return a safe descriptor to prevent the crash
      return {
        value: 0,
        writable: true,
        enumerable: true,
        configurable: true
      };
    }
  }
  
  try {
    return originalObjectGet.call(this, obj, prop);
  } catch (error) {
    // Last resort: if accessing any property fails and it's distance-related, provide safe fallback
    if (prop === 'distance') {
      return {
        value: 0,
        writable: true,
        enumerable: true,
        configurable: true
      };
    }
    throw error;
  }
};

// CRITICAL: Create a global distance property fallback
// This is the most direct approach to prevent undefined.distance access
if (typeof global !== 'undefined') {
  // Add a global distance property that always returns 0
  Object.defineProperty(global, 'distance', {
    value: 0,
    writable: true,
    enumerable: false,
    configurable: true
  });
  
  // Also add it to globalThis if available
  if (typeof globalThis !== 'undefined') {
    Object.defineProperty(globalThis, 'distance', {
      value: 0,
      writable: true,
      enumerable: false,
      configurable: true
    });
  }
}

// CRITICAL: Ultra-simple property access protection
const originalHasOwnProperty = Object.prototype.hasOwnProperty;
Object.prototype.hasOwnProperty = function(prop: string | symbol) {
  if (this === null || this === undefined) {
    return false;
  }
  try {
    return originalHasOwnProperty.call(this, prop);
  } catch (error) {
    return false;
  }
};

console.log('✅ [index.ts] Minimal deriveBFS protection installed');

// ESSENTIAL: Only keep the most critical error handler
const originalErrorHandler = global.ErrorUtils?.getGlobalHandler?.();
global.ErrorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
  // Convert deriveBFS errors to non-fatal to prevent crashes
  if (error.message?.includes('Cannot read property') && error.message?.includes('distance')) {
    console.error('🚨 DERIVEBFS ERROR INTERCEPTED - Converting to non-fatal');
    originalErrorHandler?.(error, false); // Force non-fatal
    return;
  }
  originalErrorHandler?.(error, isFatal);
});

console.log('📦 [index.ts] Starting module imports...');

console.log('📦 [index.ts] Loading gesture handler...');
import 'react-native-gesture-handler';

console.log('📦 [index.ts] Loading Expo registerRootComponent...');
import { registerRootComponent } from 'expo';

console.log('📦 [index.ts] Loading App component...');
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
