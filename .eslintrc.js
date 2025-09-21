module.exports = {
  extends: [
    'expo',
    '@react-native-community',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'react-native'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  ignorePatterns: [
    'firebase-backend/**/*',
    'codex-bridge/**/*',
    'scripts/**/*',
    'node_modules',
    '*.config.js',
    'metro.config.js',
    'babel.config.js'
  ],
  env: {
    'react-native/react-native': true,
  },
};