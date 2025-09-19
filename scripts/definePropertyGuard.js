/**
 * Property Descriptor Guard for Firebase + Hermes Compatibility
 * 
 * This guard prevents Firebase from attempting to redefine property descriptors
 * in a way that conflicts with Hermes's property handling.
 */

const isHermesRuntime = typeof globalThis?.HermesInternal === 'object';
const descriptor = Object.getOwnPropertyDescriptor(Object, 'defineProperty');
const descriptorLocked = descriptor && (!descriptor.configurable || descriptor.writable === false);

const guardEvents = (globalThis.__definePropertyGuardEvents = globalThis.__definePropertyGuardEvents || []);

console.log('🛡️ [definePropertyGuard] runtime check', {
  isHermesRuntime,
  descriptorLocked,
  descriptor
});

if (isHermesRuntime || descriptorLocked) {
  console.log('🛡️ [definePropertyGuard] No override applied (Hermes/locked descriptor)');
  guardEvents.push('skipped:locked');
  globalThis.__definePropertyGuardLoaded = false;
} else {
  const originalDefineProperty = Object.defineProperty;

  Object.defineProperty = function definePropertyGuard(obj, prop, descriptor) {
    try {
      const existingDescriptor = Object.getOwnPropertyDescriptor(obj, prop);

      if (existingDescriptor && existingDescriptor.get && !existingDescriptor.configurable) {
        console.warn(`[PropertyGuard] Skipping redefinition of non-configurable property: ${prop}`);
        return obj;
      }

      return originalDefineProperty.call(this, obj, prop, descriptor);
    } catch (error) {
      if (error?.message?.includes('unconfigurable')) {
        console.warn(`[PropertyGuard] Prevented crash redefining ${String(prop)}: ${error.message}`);
        guardEvents.push(`intercepted:${String(prop)}`);
        return obj;
      }

      throw error;
    }
  };

  Object.defineProperty.original = originalDefineProperty;
  guardEvents.push('override-applied');
  globalThis.__definePropertyGuardLoaded = true;
  console.log('✅ Property descriptor guard initialized for Firebase + Hermes compatibility');
}
