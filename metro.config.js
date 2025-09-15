const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // Expo Router configuration
  isCSSEnabled: true,
});

// Configure for Hermes compatibility (required for Expo Go)
config.transformer = {
  ...config.transformer,
  // Enable Hermes for Expo Go compatibility (SDK 52+ requires Hermes)
  hermesBytecodeBuildMode: 'optimize',
  // Enable inline requires for better performance
  inlineRequires: true,
};

// Resolver optimization - keep essential aliases and extensions
config.resolver = {
  ...config.resolver,
  
  // Define asset extensions
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
  
  // Define source extensions (add mjs for Firebase v12)
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
  
  // Module resolution optimization - keep useful aliases
  alias: {
    '@': './src',
    '@components': './src/components',
    '@screens': './src/screens',
    '@services': './src/services',
    '@stores': './src/stores',
    '@utils': './src/utils',
    '@assets': './assets',
  },
  
  // Platform-specific resolution
  platforms: ['ios', 'android', 'native', 'web'],
  
  // Block web-specific packages and problematic native modules from React Native bundle
  blockList: [
    /node_modules\/idb\/.*/,
    /node_modules\/fake-indexeddb\/.*/,
    /node_modules\/@firebase\/analytics\/.*/,
    /node_modules\/@firebase\/analytics-compat\/.*/,
    /node_modules\/@firebase\/remote-config\/.*/,
    /node_modules\/@firebase\/remote-config-compat\/.*/,
    /node_modules\/@firebase\/performance\/.*/,
    /node_modules\/@firebase\/performance-compat\/.*/,
    /node_modules\/whatwg-url\/.*/,
    /node_modules\/url-polyfill\/.*/,
    // Block react-native-reanimated completely for Expo Go compatibility
    /node_modules\/react-native-reanimated\/.*/,
    // Only block specific problematic files, not all CJS/ESM
    /node_modules\/@firebase\/.*\/dist\/index\.browser\.js$/,
    /node_modules\/@firebase\/.*\/dist\/index\.web\.js$/,
  ],
  
  // Platform-specific resolution for React Native (prioritize React Native builds)
  resolverMainFields: ['react-native', 'main', 'browser'],
};

// Custom resolver to handle Firebase packages and react-native-reanimated
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle Firebase postinstall.mjs issue (both v11 and v12)
  if (moduleName === './postinstall.mjs' && context.originModulePath && context.originModulePath.includes('@firebase/util')) {
    const path = require('path');
    const postinstallPath = path.resolve(__dirname, 'node_modules/@firebase/util/dist/postinstall.mjs');
    console.log('🔧 Resolving Firebase postinstall.mjs issue - providing stub module');
    return {
      type: 'sourceFile',
      filePath: postinstallPath,
    };
  }

  // Handle idb package - prevent it from being resolved in React Native
  if (moduleName === 'idb') {
    return {
      type: 'empty',
    };
  }


  // Handle react-native-reanimated - redirect to our wrapper
  if (moduleName === 'react-native-reanimated') {
    const path = require('path');
    const wrapperPath = path.resolve(__dirname, 'src/utils/reanimatedWrapper.ts');
    console.log(`🔄 Redirecting react-native-reanimated to wrapper: ${wrapperPath}`);
    return {
      type: 'sourceFile',
      filePath: wrapperPath,
    };
  }

  // Handle reanimated imports from other modules
  if (moduleName.includes('reanimated') && !moduleName.includes('reanimatedWrapper')) {
    const path = require('path');
    const wrapperPath = path.resolve(__dirname, 'src/utils/reanimatedWrapper.ts');
    console.log(`🔄 Redirecting reanimated import (${moduleName}) to wrapper: ${wrapperPath}`);
    return {
      type: 'sourceFile',
      filePath: wrapperPath,
    };
  }

  // Get the default resolution first
  let resolved;
  try {
    resolved = context.resolveRequest(context, moduleName, platform);
  } catch (error) {
    // If react-native-reanimated resolution fails, use our wrapper
    if (moduleName === 'react-native-reanimated' || moduleName.includes('reanimated')) {
      const path = require('path');
      const wrapperPath = path.resolve(__dirname, 'src/utils/reanimatedWrapper.ts');
      console.log(`🔄 Failed to resolve ${moduleName}, using wrapper: ${wrapperPath}`);
      return {
        type: 'sourceFile',
        filePath: wrapperPath,
      };
    }
    throw error;
  }

  // Handle Firebase packages - redirect blocked file types
  if ((moduleName.startsWith('@firebase/') || moduleName.startsWith('firebase/')) && resolved && resolved.filePath) {
    // If resolved path contains blocked files, find alternative
    if (resolved.filePath.includes('index.cjs.js') ||
        resolved.filePath.includes('index.esm.js') ||
        resolved.filePath.endsWith('.cjs.js') ||
        resolved.filePath.endsWith('.esm.js')) {

      // Try to find React Native specific builds
      const basePath = resolved.filePath.replace(/\/dist\/.*$/, '');
      const possiblePaths = [
        `${basePath}/dist/index.rn.js`,
        `${basePath}/dist/index.native.js`,
        `${basePath}/dist/index.js`,
        `${basePath}/index.js`
      ];

      const fs = require('fs');
      for (const path of possiblePaths) {
        try {
          if (fs.existsSync(path)) {
            return { type: 'sourceFile', filePath: path };
          }
        } catch (e) {
          continue;
        }
      }

      // If no alternative found, log warning and use original
      console.warn(`⚠️ No React Native alternative found for ${moduleName} at ${resolved.filePath}`);
    }
  }

  return resolved;
};

// Transformer configuration is set above with Hermes optimization

module.exports = config;