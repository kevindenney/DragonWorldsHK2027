#!/usr/bin/env node

/**
 * Health check script for Firebase emulators
 * Verifies that all emulators are running and accessible
 */

const http = require('http');
const https = require('https');

// Emulator endpoints to check
const EMULATOR_ENDPOINTS = {
  'Emulator UI': 'http://localhost:4000',
  'Functions Emulator': 'http://localhost:5001',
  'Hosting Emulator': 'http://localhost:5000',
  'Firestore Emulator': 'http://localhost:8080',
  'Auth Emulator': 'http://localhost:9099',
  'Storage Emulator': 'http://localhost:9199'
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function makeRequest(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const request = client.get(url, (response) => {
      resolve({
        status: response.statusCode,
        success: response.statusCode >= 200 && response.statusCode < 400
      });
    });

    request.on('error', (error) => {
      resolve({
        status: 'ERROR',
        success: false,
        error: error.message
      });
    });

    request.setTimeout(5000, () => {
      request.destroy();
      resolve({
        status: 'TIMEOUT',
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

async function checkEmulatorHealth() {
  console.log(colorize('🔍 Firebase Emulator Health Check', 'blue'));
  console.log('=====================================\n');

  const results = {};
  let allHealthy = true;

  for (const [name, url] of Object.entries(EMULATOR_ENDPOINTS)) {
    process.stdout.write(`Checking ${name}... `);
    
    const result = await makeRequest(url);
    results[name] = result;

    if (result.success) {
      console.log(colorize('✅ Healthy', 'green'));
    } else {
      console.log(colorize(`❌ Failed (${result.status})`, 'red'));
      if (result.error) {
        console.log(colorize(`   Error: ${result.error}`, 'red'));
      }
      allHealthy = false;
    }
  }

  console.log('\n=====================================');
  
  if (allHealthy) {
    console.log(colorize('🎉 All emulators are healthy!', 'green'));
    console.log('\nQuick Links:');
    console.log(`📊 Emulator UI: ${colorize('http://localhost:4000', 'blue')}`);
    console.log(`🔥 Firestore: ${colorize('http://localhost:4000/firestore', 'blue')}`);
    console.log(`🔐 Auth: ${colorize('http://localhost:4000/auth', 'blue')}`);
    console.log(`📁 Storage: ${colorize('http://localhost:4000/storage', 'blue')}`);
    return true;
  } else {
    console.log(colorize('⚠️  Some emulators are not responding', 'yellow'));
    console.log('\nTroubleshooting:');
    console.log('1. Make sure emulators are running: npm run emulator:start');
    console.log('2. Check if ports are available: npm run emulator:kill');
    console.log('3. Verify Java is installed for Firestore emulator');
    console.log('4. Check Firebase CLI: firebase --version');
    return false;
  }
}

async function checkFirebaseConnection() {
  console.log('\n🔌 Testing Firebase Service Connections...');
  
  // Test Auth emulator connection
  try {
    const authResponse = await makeRequest('http://localhost:9099/emulator/v1/projects/demo-dragonworldshk2027/config');
    if (authResponse.success) {
      console.log(colorize('✅ Auth emulator connection: OK', 'green'));
    } else {
      console.log(colorize('❌ Auth emulator connection: Failed', 'red'));
    }
  } catch (error) {
    console.log(colorize('❌ Auth emulator connection: Error', 'red'));
  }

  // Test Firestore emulator connection
  try {
    const firestoreResponse = await makeRequest('http://localhost:8080/v1/projects/demo-dragonworldshk2027/databases/(default)/documents');
    if (firestoreResponse.success) {
      console.log(colorize('✅ Firestore emulator connection: OK', 'green'));
    } else {
      console.log(colorize('❌ Firestore emulator connection: Failed', 'red'));
    }
  } catch (error) {
    console.log(colorize('❌ Firestore emulator connection: Error', 'red'));
  }
}

async function main() {
  const isHealthy = await checkEmulatorHealth();
  
  if (isHealthy) {
    await checkFirebaseConnection();
  }

  console.log(`\n⏰ Health check completed at ${new Date().toLocaleString()}`);
  process.exit(isHealthy ? 0 : 1);
}

// Run health check if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(colorize('Fatal error during health check:', 'red'), error);
    process.exit(1);
  });
}

module.exports = { checkEmulatorHealth, makeRequest };