const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // Expo Router configuration
  isCSSEnabled: true,
});

// Enable bundle splitting and optimization
config.transformer = {
  ...config.transformer,
  // Enable minification in production
  minifierConfig: {
    mangle: {
      keep_fnames: false,
    },
    output: {
      comments: false,
    },
  },
  // Optimize images
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
};

// Bundle splitting configuration
config.serializer = {
  ...config.serializer,
  // Create separate bundles for better caching
  createModuleIdFactory: () => {
    const fileToIdMap = new Map();
    let nextId = 0;
    
    return (path) => {
      if (!fileToIdMap.has(path)) {
        fileToIdMap.set(path, nextId);
        nextId++;
      }
      return fileToIdMap.get(path);
    };
  },
  
  // Optimize bundle output
  processModuleFilter: (modules) => {
    // Filter out unused modules in production
    if (process.env.NODE_ENV === 'production') {
      return modules.filter(module => {
        // Keep essential modules
        const path = module.path;
        
        // Always include app entry point and core modules
        if (path.includes('/node_modules/react/') ||
            path.includes('/node_modules/react-native/') ||
            path.includes('/node_modules/expo/') ||
            path.includes('/src/')) {
          return true;
        }
        
        // Filter out test files and development tools
        if (path.includes('__tests__') ||
            path.includes('.test.') ||
            path.includes('.spec.') ||
            path.includes('/testing/')) {
          return false;
        }
        
        return true;
      });
    }
    
    return modules;
  },
};

// Resolver optimization
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
  
  // Module resolution optimization
  alias: {
    // Create aliases for common paths to improve build performance
    '@': './src',
    '@components': './src/components',
    '@screens': './src/screens',
    '@services': './src/services',
    '@stores': './src/stores',
    '@utils': './src/utils',
    '@assets': './assets',
  },
  
  // Blocklist for modules we don't want to include
  blockList: [
    // Block common development files
    /.*\/__tests__\/.*/,
    /.*\.test\.(js|tsx?|jsx?)$/,
    /.*\.spec\.(js|tsx?|jsx?)$/,
    
    // Block source maps in production
    ...(process.env.NODE_ENV === 'production' ? [
      /.*\.map$/,
    ] : []),
  ],
  
  // Platform-specific resolution
  platforms: ['ios', 'android', 'native', 'web'],
};

// Cache configuration for faster rebuilds
config.cacheStores = [
  {
    name: 'filesystem',
    path: './node_modules/.cache/metro',
  },
];

// Enable experimental features for better performance
config.transformer.experimentalImportSupport = false;
config.transformer.inlineRequires = true;

// Production optimizations
if (process.env.NODE_ENV === 'production') {
  // Enable aggressive minification
  config.transformer.minifierConfig = {
    ...config.transformer.minifierConfig,
    mangle: {
      keep_fnames: false,
      keep_classnames: false,
    },
    compress: {
      drop_console: true, // Remove console.log statements
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.info', 'console.debug'],
    },
    output: {
      comments: false,
      beautify: false,
    },
  };
  
  // Enable tree shaking
  config.optimizationSizeLimit = 150000;
  
  // Optimize imports
  config.transformer.optimizeCSSImports = true;
}

// Development optimizations
if (process.env.NODE_ENV === 'development') {
  // Enable fast refresh
  config.transformer.enableBabelRCLookup = true;
  
  // Better source maps for debugging
  config.symbolicator = {
    customizeFrame: (frame) => {
      // Improve stack trace readability
      if (frame.file && frame.file.includes('node_modules')) {
        return null; // Hide node_modules frames
      }
      return frame;
    },
  };
}

module.exports = config;