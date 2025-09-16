const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // Expo Router configuration
  isCSSEnabled: true,
});

// Simple and clean configuration for development builds
config.transformer = {
  ...config.transformer,
  // Enable Hermes optimizations for development builds
  enableBabelRuntime: true,
  inlineRequires: true, // Re-enable for better performance with Hermes
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

  // Standard source extensions
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

// Simple custom resolver - only handle essential cases
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle idb package - prevent it from being resolved in React Native
  if (moduleName === 'idb') {
    return {
      type: 'empty',
    };
  }

  // Use default resolution for everything else
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;