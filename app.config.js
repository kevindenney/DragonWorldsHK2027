import { readFileSync } from 'fs';
import { join } from 'path';

// Production-ready configuration with Hermes engine
export default ({ config }) => {
  console.log('🔧 [app.config.js] Loading production configuration with Hermes');

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

  // Use Hermes for optimal performance in production
  console.log('🔧 [app.config.js] Configuring Hermes engine for production performance');
  config.expo.jsEngine = 'hermes';
  config.expo.hermes = true;

  console.log('🔧 [app.config.js] Final jsEngine setting:', config.expo.jsEngine);
  console.log('🔧 [app.config.js] Configuration complete with Hermes optimization');

  return config;
};