const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // Expo Router configuration
  isCSSEnabled: true,
});

// Enhanced configuration to handle Hermes property descriptor issues
config.transformer = {
  ...config.transformer,
  // Hermes-specific settings to avoid property descriptor conflicts
  enableBabelRuntime: false, // Disable to avoid property conflicts
  inlineRequires: false, // Disable inline requires to prevent descriptor issues

  // Conservative module handling for Hermes stability
  hermesParser: false, // Use standard parser to avoid conflicts
  unstable_allowRequireContext: true, // Enable for auth system compatibility

  // Additional property descriptor safety measures
  minifierConfig: {
    keep_fnames: true, // Preserve function names to avoid descriptor conflicts
  },
};

// Clean resolver configuration
config.resolver = {
  ...config.resolver,

  // Standard asset extensions
  assetExts: [
    ...config.resolver.assetExts,
    'bin',
    'txt',
    'jpg',
    'png',
    'json',
    'gif',
    'webp',
    'svg',
    'ttf',
    'otf',
    'mp4',
    'webm'
  ],

  // Standard source extensions (platform extensions handled separately by Metro)
  sourceExts: [
    'expo.ts',
    'expo.tsx',
    'expo.js',
    'expo.jsx',
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'wasm',
    'svg',
    'mjs'
  ],

  // Useful aliases for cleaner imports
  alias: {
    '@': './src',
    '@components': './src/components',
    '@screens': './src/screens',
    '@services': './src/services',
    '@stores': './src/stores',
    '@utils': './src/utils',
    '@assets': './assets',
  },

  // Standard platform resolution
  platforms: ['ios', 'android', 'native', 'web'],

  // Minimal blocking for web-only packages
  blockList: [
    /node_modules\/idb\/.*/,
    /node_modules\/fake-indexeddb\/.*/,
  ],

  // Standard resolution order
  resolverMainFields: ['react-native', 'main', 'browser'],
};

// Custom resolver - handle special cases and ESM package issues
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle idb package - prevent it from being resolved in React Native
  if (moduleName === 'idb') {
    return {
      type: 'empty',
    };
  }

  // Block native-only modules on web platform
  if (platform === 'web') {
    const nativeOnlyModules = [
      'react-native-maps',
      '@gorhom/bottom-sheet',
    ];

    for (const mod of nativeOnlyModules) {
      if (moduleName === mod || moduleName.startsWith(mod + '/')) {
        return { type: 'empty' };
      }
    }

    // Block internal react-native modules that don't have web equivalents
    // These are native-only and should not be bundled for web
    if (context.originModulePath?.includes('node_modules/react-native/Libraries')) {
      // Allow only modules that are shimmed by react-native-web
      // Block internal modules that try to import native-only utilities
      if (moduleName.includes('/Utilities/Platform') ||
          moduleName.includes('/ReactNative/') ||
          moduleName.includes('/NativeComponent/')) {
        return { type: 'empty' };
      }
    }

    // Block react-native internal native modules on web when imported from native packages
    if (context.originModulePath?.includes('react-native-maps') ||
        context.originModulePath?.includes('@gorhom/bottom-sheet')) {
      return { type: 'empty' };
    }
  }

  // Handle google-signin ESM imports that don't have file extensions
  // The google-signin package uses ESM-style imports without .js extensions
  if (context.originModulePath &&
      context.originModulePath.includes('@react-native-google-signin/google-signin') &&
      moduleName.startsWith('./') &&
      !moduleName.endsWith('.js')) {
    // Try to resolve with .js extension first
    try {
      return context.resolveRequest(context, moduleName + '.js', platform);
    } catch (e) {
      // If that fails, try the original
      return context.resolveRequest(context, moduleName, platform);
    }
  }

  // Use default resolution for everything else
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;