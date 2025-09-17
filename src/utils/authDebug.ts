/**
 * Debug utility to clear authentication state
 * Use this to reset auth state during development/testing
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const clearAuthStorage = async () => {
  try {
    // Clear the persisted auth storage key
    await AsyncStorage.removeItem('auth-storage');
    console.log('✅ Cleared auth storage');

    // Optionally clear all AsyncStorage (be careful in production)
    // await AsyncStorage.clear();

    return true;
  } catch (error) {
    console.error('❌ Failed to clear auth storage:', error);
    return false;
  }
};

export const debugAuthState = async () => {
  try {
    const authData = await AsyncStorage.getItem('auth-storage');
    console.log('🔍 Current auth storage:', authData ? JSON.parse(authData) : null);
  } catch (error) {
    console.error('❌ Failed to read auth storage:', error);
  }
};