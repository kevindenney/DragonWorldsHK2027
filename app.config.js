import { readFileSync } from 'fs';
import { join } from 'path';

// Production-ready configuration with Hermes engine
export default ({ config }) => {
  // If config is empty or missing expo, load from app.json
  if (!config.expo || Object.keys(config).length === 0) {
    try {
      const appJsonPath = join(process.cwd(), 'app.json');
      const appJsonContent = JSON.parse(readFileSync(appJsonPath, 'utf8'));
      config = appJsonContent;
    } catch (error) {
      config = { expo: {} };
    }
  }

  // Ensure config.expo exists
  if (!config.expo) {
    config.expo = {};
  }

  // Ensure nested objects exist
  if (!config.expo.extra) {
    config.expo.extra = {};
  }
  if (!config.expo.ios) {
    config.expo.ios = {};
  }
  if (!config.expo.ios.config) {
    config.expo.ios.config = {};
  }
  if (!config.expo.android) {
    config.expo.android = {};
  }
  if (!config.expo.android.config) {
    config.expo.android.config = {};
  }

  // Use Hermes for optimal performance in production
  config.expo.jsEngine = 'hermes';
  config.expo.hermes = true;

  // Add Google Sign-In plugin
  if (!config.expo.plugins) {
    config.expo.plugins = [];
  }
  // Add @react-native-google-signin/google-signin plugin if not already present
  const googleSignInPlugin = '@react-native-google-signin/google-signin';
  if (!config.expo.plugins.some(p => p === googleSignInPlugin || (Array.isArray(p) && p[0] === googleSignInPlugin))) {
    config.expo.plugins.push(googleSignInPlugin);
  }

  // Inject Google Maps API key from environment variable
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (googleMapsApiKey) {
    config.expo.ios.config.googleMapsApiKey = googleMapsApiKey;
    config.expo.android.config.googleMaps = {
      apiKey: googleMapsApiKey,
    };
  }

  return config;
};