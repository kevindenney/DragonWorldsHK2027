/**
 * Image Upload Service
 *
 * Handles permissions, image picking, compression, and Firebase Storage upload
 * for profile pictures and other user images.
 */

import { Platform, Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { auth } from '../config/firebase';

// Firebase Storage bucket name (without gs://)
const STORAGE_BUCKET = 'dragonworldshk2027.firebasestorage.app';

// ============================================
// Debug Logging
// ============================================

/**
 * Comprehensive debug function to log Firebase state
 */
export function debugFirebaseState(context: string): void {
  console.log(`\n========== [ImageUpload Debug: ${context}] ==========`);
  console.log('[DEBUG] Using REST API upload (no native SDK)');
  console.log('[DEBUG] Storage bucket:', STORAGE_BUCKET);
  console.log('[DEBUG] Web auth object exists:', !!auth);

  if (auth) {
    console.log('[DEBUG] auth.currentUser exists:', !!auth.currentUser);
    if (auth.currentUser) {
      console.log('[DEBUG] auth.currentUser.uid:', auth.currentUser.uid);
      console.log('[DEBUG] auth.currentUser.email:', auth.currentUser.email);
    }
  }
  console.log('========== [End Debug] ==========\n');
}

// ============================================
// Types
// ============================================

export interface ImagePickResult {
  uri: string;
  width: number;
  height: number;
  cancelled: boolean;
}

export interface UploadProgressCallback {
  (progress: number): void;
}

export interface UploadResult {
  downloadURL: string;
  path: string;
}

// ============================================
// Permission Handling
// ============================================

/**
 * Request camera permission with helpful messaging
 */
export async function requestCameraPermission(): Promise<boolean> {
  const { status: existingStatus } = await ImagePicker.getCameraPermissionsAsync();

  if (existingStatus === 'granted') {
    return true;
  }

  const { status } = await ImagePicker.requestCameraPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert(
      'Camera Permission Required',
      'Dragon Worlds HK needs access to your camera to take a profile photo. Please enable camera access in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  }

  return true;
}

/**
 * Request media library permission with helpful messaging
 */
export async function requestMediaLibraryPermission(): Promise<boolean> {
  const { status: existingStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();

  if (existingStatus === 'granted') {
    return true;
  }

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert(
      'Photo Library Permission Required',
      'Dragon Worlds HK needs access to your photo library to select a profile photo. Please enable photo access in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  }

  return true;
}

// ============================================
// Image Picking
// ============================================

/**
 * Pick an image from the device gallery with square cropping
 */
export async function pickImageFromGallery(): Promise<ImagePickResult | null> {
  const hasPermission = await requestMediaLibraryPermission();

  if (!hasPermission) {
    return null;
  }

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1], // Square crop for profile pictures
      quality: 1, // Full quality - we'll compress later
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { uri: '', width: 0, height: 0, cancelled: true };
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      cancelled: false,
    };
  } catch (error) {
    console.error('[ImageUpload] Error picking image from gallery:', error);
    Alert.alert('Error', 'Failed to select image. Please try again.');
    return null;
  }
}

/**
 * Check if the device has an actual camera available
 * iOS Simulator does not have camera access
 */
async function checkCameraAvailability(): Promise<boolean> {
  // Check if we're on iOS Simulator by trying to get camera permissions
  // The simulator will grant permission but launchCameraAsync will fail
  if (Platform.OS === 'ios') {
    // expo-device can detect simulator, but we can also check via expo-image-picker
    const { status } = await ImagePicker.getCameraPermissionsAsync();
    // Even if permission is granted, simulator doesn't have camera hardware
    // We'll rely on the try-catch below to handle the actual failure
  }
  return true;
}

/**
 * Take a photo with the camera with square cropping
 */
export async function pickImageFromCamera(): Promise<ImagePickResult | null> {
  const hasPermission = await requestCameraPermission();

  if (!hasPermission) {
    return null;
  }

  try {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1], // Square crop for profile pictures
      quality: 1, // Full quality - we'll compress later
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { uri: '', width: 0, height: 0, cancelled: true };
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      cancelled: false,
    };
  } catch (error: any) {
    console.error('[ImageUpload] Error taking photo:', error);

    // Provide a more helpful error message for simulator users
    const errorMessage = error?.message || '';
    if (
      Platform.OS === 'ios' &&
      (errorMessage.includes('simulator') ||
       errorMessage.includes('source type') ||
       errorMessage.includes('not available'))
    ) {
      Alert.alert(
        'Camera Not Available',
        'The camera is not available on the iOS Simulator. Please use "Choose from Library" instead, or test on a physical device.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
    return null;
  }
}

// ============================================
// Image Compression
// ============================================

/**
 * Compress an image to reduce file size while maintaining quality
 * Target: 800px max dimension, 80% JPEG quality
 */
export async function compressImage(uri: string): Promise<string> {
  try {
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: 800,
            // Height will auto-scale to maintain aspect ratio
          },
        },
      ],
      {
        compress: 0.8, // 80% quality
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return manipulatedImage.uri;
  } catch (error) {
    console.error('[ImageUpload] Error compressing image:', error);
    // Return original if compression fails
    return uri;
  }
}

// ============================================
// Firebase Upload
// ============================================

/**
 * Upload a profile image to Firebase Storage using REST API
 * This approach bypasses the Firebase SDK's blob handling issues in React Native
 *
 * @param userId - The user's UID
 * @param imageUri - Local URI of the image to upload
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns The download URL and storage path
 */
export async function uploadProfileImage(
  userId: string,
  imageUri: string,
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  // COMPREHENSIVE DEBUG LOGGING
  debugFirebaseState('uploadProfileImage START');

  console.log('[ImageUpload] === UPLOAD ATTEMPT (REST API) ===');
  console.log('[ImageUpload] Passed userId:', userId);
  console.log('[ImageUpload] Image URI (first 100 chars):', imageUri?.substring(0, 100));

  // Check #1: Auth initialization
  if (!auth) {
    console.error('[ImageUpload] FAILURE: auth is null/undefined');
    throw new Error('Firebase Auth is not initialized.');
  }
  console.log('[ImageUpload] CHECK PASSED: auth exists');

  // Check #2: Current user exists
  if (!auth.currentUser) {
    console.error('[ImageUpload] FAILURE: auth.currentUser is null');
    throw new Error('No authenticated user. Please sign in again.');
  }
  console.log('[ImageUpload] CHECK PASSED: auth.currentUser exists');
  console.log('[ImageUpload] auth.currentUser.uid:', auth.currentUser.uid);

  // Check #3: User ID match
  if (auth.currentUser.uid !== userId) {
    console.warn('[ImageUpload] WARNING: User ID mismatch!');
    console.warn('[ImageUpload] Passed userId:', userId);
    console.warn('[ImageUpload] auth.currentUser.uid:', auth.currentUser.uid);
    userId = auth.currentUser.uid;
  }

  // Check #4: Image URI validation
  if (!imageUri || imageUri.length === 0) {
    console.error('[ImageUpload] FAILURE: imageUri is empty');
    throw new Error('No image URI provided');
  }

  // Compress the image first
  console.log('[ImageUpload] Starting image compression...');
  onProgress?.(5);
  let compressedUri: string;
  try {
    compressedUri = await compressImage(imageUri);
    console.log('[ImageUpload] Compression complete');
    onProgress?.(15);
  } catch (compressionError: any) {
    console.error('[ImageUpload] FAILURE: Image compression failed:', compressionError);
    throw new Error(`Image compression failed: ${compressionError.message}`);
  }

  // Generate storage path with timestamp to avoid caching issues
  const timestamp = Date.now();
  const storagePath = `profile-pictures/${userId}/${timestamp}.jpg`;
  const encodedPath = encodeURIComponent(storagePath);

  console.log('[ImageUpload] Storage path:', storagePath);
  console.log('[ImageUpload] Encoded path:', encodedPath);

  try {
    // Get auth token for REST API
    console.log('[ImageUpload] Getting auth token...');
    const authToken = await auth.currentUser.getIdToken(true);
    console.log('[ImageUpload] Auth token obtained (length):', authToken.length);
    onProgress?.(20);

    // Read the image file as base64
    console.log('[ImageUpload] Reading image file...');
    const base64Data = await FileSystem.readAsStringAsync(compressedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log('[ImageUpload] Image read as base64 (length):', base64Data.length);
    onProgress?.(40);

    // Convert base64 to binary for upload
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    console.log('[ImageUpload] Converted to binary (bytes):', bytes.length);
    onProgress?.(50);

    // Upload to Firebase Storage REST API
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodedPath}`;
    console.log('[ImageUpload] Upload URL:', uploadUrl);
    console.log('[ImageUpload] Starting REST API upload...');

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'image/jpeg',
      },
      body: bytes,
    });

    console.log('[ImageUpload] Upload response status:', uploadResponse.status);
    onProgress?.(80);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('[ImageUpload] Upload failed:', errorText);
      throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('[ImageUpload] Upload result:', JSON.stringify(uploadResult, null, 2));

    // Construct the download URL
    // Format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={downloadToken}
    const downloadToken = uploadResult.downloadTokens;
    const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodedPath}?alt=media&token=${downloadToken}`;

    console.log('[ImageUpload] Download URL:', downloadURL);
    onProgress?.(100);

    return {
      downloadURL,
      path: storagePath,
    };
  } catch (uploadError: any) {
    console.error('[ImageUpload] ========== UPLOAD ERROR ==========');
    console.error('[ImageUpload] Error:', uploadError);
    console.error('[ImageUpload] Error message:', uploadError?.message);
    console.error('[ImageUpload] ========== END ERROR ==========');

    // Provide specific error messages
    let errorMessage = `Upload failed: ${uploadError?.message || 'Unknown error'}`;
    if (uploadError?.message?.includes('401') || uploadError?.message?.includes('403')) {
      errorMessage = 'Storage permission denied. You must be signed in to upload images.';
    } else if (uploadError?.message?.includes('507')) {
      errorMessage = 'Storage quota exceeded. Please contact support.';
    }

    throw new Error(errorMessage);
  }
}

/**
 * Delete a profile image from Firebase Storage using REST API
 *
 * @param storagePath - The storage path of the image to delete
 */
export async function deleteProfileImage(storagePath: string): Promise<void> {
  try {
    if (!auth?.currentUser) {
      console.warn('[ImageUpload] No authenticated user for delete operation');
      return;
    }

    const authToken = await auth.currentUser.getIdToken(true);
    const encodedPath = encodeURIComponent(storagePath);
    const deleteUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodedPath}`;

    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (__DEV__) {
      console.log('[ImageUpload] Delete response status:', response.status);
    }

    // 404 means already deleted, which is fine
    if (response.ok || response.status === 404) {
      if (__DEV__) {
        console.log('[ImageUpload] Image deleted:', storagePath);
      }
      return;
    }

    const errorText = await response.text();
    console.error('[ImageUpload] Delete failed:', errorText);
    throw new Error(`Delete failed: ${response.status}`);
  } catch (error: any) {
    // Ignore "object not found" errors - the image may have already been deleted
    if (error.message?.includes('404')) {
      return;
    }
    console.error('[ImageUpload] Error deleting image:', error);
    throw error;
  }
}

// ============================================
// Utilities
// ============================================

/**
 * Convert a local URI to a Blob for upload
 * Uses XMLHttpRequest for better React Native compatibility
 */
async function uriToBlob(uri: string): Promise<Blob> {
  if (__DEV__) {
    console.log('[ImageUpload] Converting URI to blob:', uri);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      if (__DEV__) {
        console.log('[ImageUpload] XHR loaded, response type:', xhr.responseType);
        console.log('[ImageUpload] XHR response:', typeof xhr.response);
      }
      resolve(xhr.response as Blob);
    };
    xhr.onerror = function (e) {
      console.error('[ImageUpload] XHR error:', e);
      reject(new Error('Failed to load image'));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

/**
 * Check if the device supports camera functionality
 */
export function isCameraAvailable(): boolean {
  // Camera is available on all native platforms
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * Extract the storage path from a Firebase Storage download URL
 */
export function extractStoragePathFromURL(downloadURL: string): string | null {
  try {
    // Firebase Storage URLs contain the path encoded in the URL
    const match = downloadURL.match(/\/o\/(.+?)\?/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
    return null;
  } catch {
    return null;
  }
}
