// Dragon Worlds HK 2027 - React Native Entry Point with Hermes
console.log('🏁 [index.ts] Initializing Dragon Worlds HK 2027 app with Hermes');

// Import Reanimated early for proper initialization with Hermes
console.log(`⏰ [MODULE-TIMING] ${performance.now()}ms - Before react-native-reanimated import`);
import 'react-native-reanimated';
console.log(`✅ [MODULE-TIMING] ${performance.now()}ms - After react-native-reanimated import`);

console.log(`⏰ [MODULE-TIMING] ${performance.now()}ms - Before react-native-gesture-handler import`);
import 'react-native-gesture-handler';
console.log(`✅ [MODULE-TIMING] ${performance.now()}ms - After react-native-gesture-handler import`);

console.log(`⏰ [MODULE-TIMING] ${performance.now()}ms - Before expo import`);
import { registerRootComponent } from 'expo';
console.log(`✅ [MODULE-TIMING] ${performance.now()}ms - After expo import`);

console.log(`⏰ [MODULE-TIMING] ${performance.now()}ms - Before App import`);
import App from './App';
console.log(`✅ [MODULE-TIMING] ${performance.now()}ms - After App import`);

console.log('✅ [index.ts] All imports completed with Hermes optimizations');
console.log('📱 [index.ts] Registering root component...');

registerRootComponent(App);

console.log('✅ [index.ts] App registered successfully with Hermes engine');