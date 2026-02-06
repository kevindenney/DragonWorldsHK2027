// Production-ready configuration with Hermes engine
// Expo automatically passes app.json's "expo" content via the config parameter
export default ({ config }) => {
  // Ensure nested objects exist (config is already the expo content)
  config.extra = config.extra || {};
  config.ios = config.ios || {};
  config.ios.config = config.ios.config || {};
  config.android = config.android || {};
  config.android.config = config.android.config || {};
  config.plugins = config.plugins || [];

  // Use Hermes for optimal performance in production
  config.jsEngine = 'hermes';

  // Add Google Sign-In plugin if not already present
  const googleSignInPlugin = '@react-native-google-signin/google-signin';
  if (!config.plugins.some(p => p === googleSignInPlugin || (Array.isArray(p) && p[0] === googleSignInPlugin))) {
    config.plugins.push(googleSignInPlugin);
  }

  // Add expo-image-picker plugin for profile photo functionality
  const imagePickerPlugin = 'expo-image-picker';
  if (!config.plugins.some(p => p === imagePickerPlugin || (Array.isArray(p) && p[0] === imagePickerPlugin))) {
    config.plugins.push([
      imagePickerPlugin,
      {
        photosPermission: 'Allow Dragon Worlds HK to access your photos to set your profile picture.',
        cameraPermission: 'Allow Dragon Worlds HK to access your camera to take a profile picture.',
      },
    ]);
  }

  // Inject Google Maps API key from environment variable
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (googleMapsApiKey) {
    config.ios.config.googleMapsApiKey = googleMapsApiKey;
    config.android.config.googleMaps = {
      apiKey: googleMapsApiKey,
    };
  }

  return config;
};
