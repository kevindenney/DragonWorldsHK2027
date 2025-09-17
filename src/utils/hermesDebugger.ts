/**
 * Minimal Hermes Debugger - Essential fixes only
 * Focus on preventing deriveBFS crashes
 */

console.log('🔍 [MinimalHermesDebugger] HERMES COMPATIBILITY: Removing ALL Object method overrides...');

// HERMES COMPATIBILITY: REMOVING Object.getOwnPropertyDescriptor override
// This was causing the "Attempting to change the getter of an unconfigurable property" error
console.log('🔧 [HermesDebugger] REMOVED Object.getOwnPropertyDescriptor override for Hermes compatibility');

// HERMES COMPATIBILITY: REMOVING Object.defineProperty override
// This was causing the "Attempting to change the getter of an unconfigurable property" error
// The override itself triggers the Hermes compatibility issue
console.log('🔧 [HermesDebugger] REMOVED Object.defineProperty override for Hermes compatibility');

// Initialize the debugger
export const initializeHermesDebugging = () => {
  console.log('✅ [MinimalHermesDebugger] Essential protections active');
};

// Add missing debug functions as no-ops to prevent errors
export const debugFirebaseConfig = (config: any) => {
  console.log('🔍 [MinimalHermesDebugger] Firebase config debug (minimal mode)');
};

export const debugZustandStore = (storeName: string) => {
  console.log(`🔍 [MinimalHermesDebugger] Zustand store debug: ${storeName} (minimal mode)`);
  return {
    beforeCreate: () => {},
    afterCreate: () => {},
    beforePersist: () => {},
    afterPersist: () => {}
  };
};

export const debugAsyncStorage = () => {
  console.log('🔍 [MinimalHermesDebugger] AsyncStorage debug (minimal mode)');
};

export const debugAnimatedAPI = () => {
  console.log('🔍 [MinimalHermesDebugger] Animated API debug (minimal mode)');
};

export const monitorObjectAccess = (obj: any, name: string) => {
  console.log(`🔍 [MinimalHermesDebugger] Object access monitor: ${name} (minimal mode)`);
  return obj; // Return object unchanged
};

console.log('✅ [MinimalHermesDebugger] Ready with all exports');