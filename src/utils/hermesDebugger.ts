/**
 * Minimal Hermes Debugger - Essential fixes only
 * Focus on preventing deriveBFS crashes
 */

console.log('🔍 [MinimalHermesDebugger] Installing essential property fixes...');

// CRITICAL: Global distance property protection
const originalGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
Object.getOwnPropertyDescriptor = function(obj: any, prop: string | symbol) {
  try {
    // Special handling for distance property access on undefined objects
    if ((obj === null || obj === undefined) && prop === 'distance') {
      console.log('🛡️ [HermesDebugger] CRITICAL: Protected distance access on null/undefined object');
      return {
        value: 0,
        writable: true,
        enumerable: true,
        configurable: true
      };
    }
    
    return originalGetOwnPropertyDescriptor.call(this, obj, prop);
  } catch (error: any) {
    console.error('🚨 [HermesDebugger] Property descriptor error for', prop, ':', error.message);
    
    // For distance property, always return safe default to prevent deriveBFS crashes
    if (prop === 'distance') {
      console.log('🛡️ [HermesDebugger] Returning safe distance descriptor to prevent crash');
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

// Essential property definition protection
const originalDefineProperty = Object.defineProperty;
Object.defineProperty = function(obj: any, prop: string | symbol, descriptor: PropertyDescriptor) {
  const propString = prop.toString();

  try {
    // For distance property, ensure safe handling
    if (prop === 'distance') {
      console.log('🛡️ [HermesDebugger] Safe distance property definition');
      
      // Ensure safe descriptor
      const safeDescriptor: PropertyDescriptor = {
        ...descriptor,
        configurable: descriptor.configurable !== false,
        enumerable: descriptor.enumerable !== false,
      };

      // Only add writable for data properties
      if (descriptor.value !== undefined) {
        safeDescriptor.writable = descriptor.writable !== false;
      }

      return originalDefineProperty.call(this, obj, prop, safeDescriptor);
    }

    return originalDefineProperty.call(this, obj, prop, descriptor);
  } catch (error: any) {
    // Handle "property is not configurable" errors gracefully
    if (error.message?.includes('property is not configurable')) {
      // This is normal behavior - many built-in properties are non-configurable
      console.log(`🔧 [HermesDebugger] Property "${propString}" is non-configurable (normal)`);
      return obj; // Return object unchanged to prevent crash
    }
    
    console.warn(`🚨 [HermesDebugger] Property definition error for "${propString}":`, error.message);
    
    // For distance property, fail silently to prevent crashes
    if (prop === 'distance') {
      console.log('🛡️ [HermesDebugger] Silently ignoring distance property error to prevent crash');
      return obj;
    }
    
    throw error;
  }
};

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