#!/usr/bin/env node

/**
 * Script to fix Firebase postinstall.mjs issue
 * This creates the missing postinstall.mjs file that Firebase utilities expect
 */

const fs = require('fs');
const path = require('path');

const postinstallPath = path.join(__dirname, '..', 'node_modules', '@firebase', 'util', 'dist', 'postinstall.mjs');
const postinstallDir = path.dirname(postinstallPath);

// Ensure the directory exists
if (fs.existsSync(postinstallDir)) {
  const stubContent = `// Stub file to resolve Firebase postinstall.mjs import issue
export function getDefaultsFromPostinstall() {
  return {};
}`;

  try {
    fs.writeFileSync(postinstallPath, stubContent);
    console.log('✅ Created Firebase postinstall.mjs stub file');
  } catch (error) {
    console.warn('⚠️ Could not create Firebase postinstall.mjs stub:', error.message);
  }
} else {
  console.log('ℹ️ Firebase util directory not found, skipping postinstall.mjs fix');
}