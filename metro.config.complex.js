const { getDefaultConfig } = require('expo/metro-config');

const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // Expo Router configuration
  isCSSEnabled: true,
});

// HERMES COMPATIBILITY: Enhanced transformer with source maps and minifier config
config.transformer = {
  ...config.transformer,
  // COMPLETELY disable Hermes bytecode compilation
  hermesCommand: '', // Disable Hermes completely
  // hermesBytecodeBuildMode: 'optimize', // DISABLED for debugging
  // Disable inline requires for better compatibility
  inlineRequires: false,
  // Disable all optimization that might conflict with Hermes
  enableBabelRCLookup: false,
  // Use plain JavaScript transformation without bytecode
  enableBabelRuntime: false,

  // Enhanced minifier configuration for better property descriptor handling
  minifierConfig: {
    output: {
      ascii_only: true,
      quote_style: 3,
      wrap_iife: true,
    },
    sourceMap: {
      includeSources: false,
    },
    toplevel: false,
    compress: {
      reduce_funcs: false,
      // Prevent property descriptor mangling that causes Hermes issues
      keep_fnames: true,
      keep_fargs: true,
      properties: false, // Don't optimize property access
    },
    mangle: {
      // Prevent property mangling that could cause descriptor conflicts
      properties: false,
      keep_fnames: true,
    },
  },
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

  // Enhanced Firebase packages resolution - prevent property descriptor conflicts
  if ((moduleName.startsWith('@firebase/') || moduleName.startsWith('firebase/')) && resolved && resolved.filePath) {

    // Special handling for problematic Firebase modules that cause property descriptor errors
    const problematicModules = [
      '@firebase/auth',
      '@firebase/firestore',
      '@firebase/analytics',
      '@firebase/storage',
      'firebase/auth',
      'firebase/firestore'
    ];

    const isProblematic = problematicModules.some(mod => moduleName.includes(mod));

    // If resolved path contains CJS files or is problematic, find ESM alternative
    if (resolved.filePath.includes('index.cjs.js') ||
        resolved.filePath.endsWith('.cjs.js') ||
        resolved.filePath.includes('.browser.js') ||
        resolved.filePath.includes('.web.js') ||
        isProblematic) {

      // Enhanced path resolution with React Native specific builds
      const basePath = resolved.filePath.replace(/\/dist\/.*$/, '');
      const possiblePaths = [
        // Prefer React Native specific builds first
        `${basePath}/dist/rn/index.js`,
        `${basePath}/dist/react-native/index.js`,
        `${basePath}/dist/native/index.js`,
        // Then ESM builds that work well with React Native
        `${basePath}/dist/esm/index.esm2017.js`,
        `${basePath}/dist/esm/index.esm.js`,
        `${basePath}/dist/esm/index.native.js`,
        `${basePath}/dist/index.esm.js`,
        `${basePath}/dist/index.native.js`,
        `${basePath}/dist/index.rn.js`,
        // Fallback to generic builds
        `${basePath}/dist/index.js`,
        `${basePath}/index.js`
      ];

      const fs = require('fs');
      for (const path of possiblePaths) {
        try {
          if (fs.existsSync(path)) {
            // Additional check: avoid browser-specific builds
            const content = fs.readFileSync(path, 'utf8');
            if (!content.includes('window.') && !content.includes('document.')) {
              console.log(`✅ Enhanced Firebase resolution: ${moduleName} → ${path.split('/').pop()}`);
              return {
                type: 'sourceFile',
                filePath: path
              };
            }
          }
        } catch (e) {
          continue;
        }
      }

      // If no suitable alternative found, log detailed info for debugging
      if (isProblematic) {
        console.warn(`⚠️ PROPERTY CONFLICT RISK: ${moduleName} using potentially problematic build at ${resolved.filePath}`);
        console.warn(`   This module is known to cause property descriptor errors in Expo Go`);
      }
    }

    // Additional check for Firebase Auth specifically (most common source of property errors)
    if (moduleName.includes('auth') && resolved.filePath) {
      console.log(`🔍 Firebase Auth module resolution: ${moduleName} → ${resolved.filePath}`);

      // Try to use a more compatible auth build
      const authBasePath = resolved.filePath.replace(/\/dist\/.*$/, '');
      const compatibleAuthPaths = [
        `${authBasePath}/dist/esm/index.esm2017.js`,
        `${authBasePath}/dist/index.native.js`
      ];

      const fs = require('fs');
      for (const path of compatibleAuthPaths) {
        try {
          if (fs.existsSync(path)) {
            console.log(`🔐 Using compatible Firebase Auth build: ${path.split('/').pop()}`);
            return { type: 'sourceFile', filePath: path };
          }
        } catch (e) {
          continue;
        }
      }
    }
  }

  return resolved;
};

// Transformer configuration is set above with Hermes optimization

// Ensure prelude guard runs before any other modules
const existingGetModulesRunBeforeMainModule = config.serializer?.getModulesRunBeforeMainModule;
config.serializer = {
  ...config.serializer,
  getModulesRunBeforeMainModule() {
    const additionalModules = existingGetModulesRunBeforeMainModule
      ? existingGetModulesRunBeforeMainModule.call(this)
      : [];
    return [
      path.resolve(__dirname, 'scripts/definePropertyGuard.js'),
      ...additionalModules,
    ];
  },
};

module.exports = config;
