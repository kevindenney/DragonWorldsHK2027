// Dragon Worlds HK 2027 - Clean React Native Entry Point for Development Builds
console.log('🏁 [index.ts] Initializing Dragon Worlds HK 2027 app with Hermes');

// Import Reanimated early for proper initialization with Hermes
import 'react-native-reanimated';
import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import App from './App';

console.log('✅ [index.ts] All imports completed with Hermes optimizations');
console.log('📱 [index.ts] Registering root component...');

registerRootComponent(App);

console.log('✅ [index.ts] App registered successfully with development build');