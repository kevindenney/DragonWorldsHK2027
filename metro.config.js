const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // Expo Router configuration
  isCSSEnabled: true,
});

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
  
  // Define source extensions
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
    'svg'
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
  
  // Block web-specific packages from React Native bundle
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
    // Only block specific problematic files, not all CJS/ESM
    /node_modules\/@firebase\/.*\/dist\/index\.browser\.js$/,
    /node_modules\/@firebase\/.*\/dist\/index\.web\.js$/,
  ],
  
  // Platform-specific resolution for React Native (prioritize React Native builds)
  resolverMainFields: ['react-native', 'main', 'browser'],
};

// Custom resolver to handle Firebase packages
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle idb package - prevent it from being resolved in React Native
  if (moduleName === 'idb') {
    return {
      type: 'empty',
    };
  }
  
  // Get the default resolution first
  let resolved;
  try {
    resolved = context.resolveRequest(context, moduleName, platform);
  } catch (error) {
    // If default resolution fails, just let it fail
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
            console.log(`🔄 Redirecting ${moduleName} from ${resolved.filePath} to ${path}`);
            return { type: 'sourceFile', filePath: path };
          }
        } catch (e) {
          continue;
        }
      }
      
      // If no alternative found, log and use original (will likely fail but with better error)
      console.warn(`⚠️ No React Native alternative found for ${moduleName} at ${resolved.filePath}`);
    }
  }
  
  return resolved;
};

// Basic transformer optimizations
config.transformer = {
  ...config.transformer,
  // Enable inline requires for better performance
  inlineRequires: true,
};

module.exports = config;