/**
 * Minimal Hermes Debugger - Essential fixes only
 * Focus on preventing deriveBFS crashes
 */


// HERMES COMPATIBILITY: REMOVING Object.getOwnPropertyDescriptor override
// This was causing the "Attempting to change the getter of an unconfigurable property" error

// HERMES COMPATIBILITY: REMOVING Object.defineProperty override
// This was causing the "Attempting to change the getter of an unconfigurable property" error
// The override itself triggers the Hermes compatibility issue

// Initialize the debugger
export const initializeHermesDebugging = () => {
};

// Add missing debug functions as no-ops to prevent errors
export const debugFirebaseConfig = (config: any) => {
};

export const debugZustandStore = (storeName: string) => {
  return {
    beforeCreate: () => {},
    afterCreate: () => {},
    beforePersist: () => {},
    afterPersist: () => {}
  };
};

export const debugAsyncStorage = () => {
};

export const debugAnimatedAPI = () => {
};

export const monitorObjectAccess = (obj: any, name: string) => {
  return obj; // Return object unchanged
};
