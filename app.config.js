import { readFileSync } from 'fs';
import { join } from 'path';

// Dynamic configuration for JS engine testing
export default ({ config }) => {
  console.log('🔧 [app.config.js] Processing dynamic configuration...');
  console.log('🔧 [app.config.js] EXPO_USE_HERMES:', process.env.EXPO_USE_HERMES);
  console.log('🔧 [app.config.js] FORCE_JSC:', process.env.FORCE_JSC);

  // If config is empty or missing expo, load from app.json
  if (!config.expo || Object.keys(config).length === 0) {
    console.log('🔧 [app.config.js] Loading base configuration from app.json');
    try {
      const appJsonPath = join(process.cwd(), 'app.json');
      const appJsonContent = JSON.parse(readFileSync(appJsonPath, 'utf8'));
      config = appJsonContent;
    } catch (error) {
      console.error('🔧 [app.config.js] ERROR loading app.json:', error.message);
      config = { expo: {} };
    }
  }

  // Ensure config.expo exists
  if (!config.expo) {
    config.expo = {};
  }

  // Ensure config.expo.extra exists
  if (!config.expo.extra) {
    config.expo.extra = {};
  }

  // Override JS engine based on environment variables (legacy JSC support)
  if (process.env.FORCE_JSC === 'true') {
    console.log('🔧 [app.config.js] Forcing JSC engine for legacy compatibility');
    config.expo.jsEngine = 'jsc';
    config.expo.hermes = false;
  } else {
    console.log('🔧 [app.config.js] Using Hermes engine for production performance');
    // Use Hermes for better performance (default from app.json)
    config.expo.jsEngine = config.expo?.jsEngine || 'hermes';
    config.expo.hermes = config.expo?.hermes !== undefined ? config.expo.hermes : true;
  }

  // Additional build-specific configurations for JSC testing
  if (process.env.NODE_ENV === 'development' && process.env.FORCE_JSC === 'true') {
    console.log('🔧 [app.config.js] Applying JSC test build optimizations');

    // Keep New Architecture disabled for Expo Go compatibility
    config.expo.newArchEnabled = false;

    // Add build-specific extra configurations while preserving existing extra
    config.expo.extra = {
      ...config.expo.extra,
      jsEngineTest: true,
      buildType: 'jsc-test',
      enableHermesDebugging: false
    };
  }

  console.log('🔧 [app.config.js] Final jsEngine setting:', config.expo.jsEngine);
  return config;
};