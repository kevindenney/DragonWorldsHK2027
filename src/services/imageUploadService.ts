/**
 * Image Upload Service
 *
 * Handles permissions, image picking, compression, and Firebase Storage upload
 * for profile pictures and other user images.
 */

import { Platform, Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from '../config/firebase';

// ============================================
// Debug Logging
// ============================================

/**
 * Comprehensive debug function to log Firebase state
 */
export function debugFirebaseState(context: string): void {
  console.log(`\n========== [ImageUpload Debug: ${context}] ==========`);
  console.log('[DEBUG] storage object exists:', !!storage);
  console.log('[DEBUG] storage type:', typeof storage);
  console.log('[DEBUG] auth object exists:', !!auth);
  console.log('[DEBUG] auth type:', typeof auth);

  if (auth) {
    console.log('[DEBUG] auth.currentUser exists:', !!auth.currentUser);
    if (auth.currentUser) {
      console.log('[DEBUG] auth.currentUser.uid:', auth.currentUser.uid);
      console.log('[DEBUG] auth.currentUser.email:', auth.currentUser.email);
      console.log('[DEBUG] auth.currentUser.providerId:', auth.currentUser.providerId);
      console.log('[DEBUG] auth.currentUser.providerData:', JSON.stringify(auth.currentUser.providerData));
    }
  }

  if (storage) {
    try {
      // Try to access storage properties
      console.log('[DEBUG] storage.app exists:', !!(storage as any).app);
      console.log('[DEBUG] storage.app.name:', (storage as any).app?.name);
      console.log('[DEBUG] storage._bucket:', (storage as any)._bucket);
    } catch (e) {
      console.log('[DEBUG] Error accessing storage properties:', e);
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
  } catch (error) {
    console.error('[ImageUpload] Error taking photo:', error);
    Alert.alert('Error', 'Failed to take photo. Please try again.');
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
 * Upload a profile image to Firebase Storage
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

  console.log('[ImageUpload] === UPLOAD ATTEMPT ===');
  console.log('[ImageUpload] Passed userId:', userId);
  console.log('[ImageUpload] Image URI (first 100 chars):', imageUri?.substring(0, 100));
  console.log('[ImageUpload] Image URI length:', imageUri?.length);

  // Check #1: Storage initialization
  if (!storage) {
    console.error('[ImageUpload] FAILURE: storage is null/undefined');
    throw new Error('Firebase Storage is not initialized. Storage object is null.');
  }
  console.log('[ImageUpload] CHECK PASSED: storage exists');

  // Check #2: Auth initialization
  if (!auth) {
    console.error('[ImageUpload] FAILURE: auth is null/undefined');
    throw new Error('Firebase Auth is not initialized. Auth object is null.');
  }
  console.log('[ImageUpload] CHECK PASSED: auth exists');

  // Check #3: Current user exists
  if (!auth.currentUser) {
    console.error('[ImageUpload] FAILURE: auth.currentUser is null');
    console.error('[ImageUpload] auth object:', JSON.stringify(auth, null, 2).substring(0, 500));
    throw new Error('No authenticated user. auth.currentUser is null.');
  }
  console.log('[ImageUpload] CHECK PASSED: auth.currentUser exists');
  console.log('[ImageUpload] auth.currentUser.uid:', auth.currentUser.uid);

  // Check #4: User ID match
  if (auth.currentUser.uid !== userId) {
    console.warn('[ImageUpload] WARNING: User ID mismatch!');
    console.warn('[ImageUpload] Passed userId:', userId);
    console.warn('[ImageUpload] auth.currentUser.uid:', auth.currentUser.uid);
    console.warn('[ImageUpload] Using auth.currentUser.uid for upload');
    userId = auth.currentUser.uid;
  }
  console.log('[ImageUpload] CHECK PASSED: Using userId:', userId);

  // Check #5: Image URI validation
  if (!imageUri || imageUri.length === 0) {
    console.error('[ImageUpload] FAILURE: imageUri is empty');
    throw new Error('No image URI provided');
  }
  console.log('[ImageUpload] CHECK PASSED: imageUri is valid');

  // Compress the image first
  console.log('[ImageUpload] Starting image compression...');
  let compressedUri: string;
  try {
    compressedUri = await compressImage(imageUri);
    console.log('[ImageUpload] Compression complete. Compressed URI (first 100 chars):', compressedUri?.substring(0, 100));
  } catch (compressionError: any) {
    console.error('[ImageUpload] FAILURE: Image compression failed:', compressionError);
    throw new Error(`Image compression failed: ${compressionError.message}`);
  }

  // Generate storage path with timestamp to avoid caching issues
  const timestamp = Date.now();
  const storagePath = `profile-pictures/${userId}/${timestamp}.jpg`;
  const storageRef = ref(storage, storagePath);

  if (__DEV__) {
    console.log('[ImageUpload] Storage path:', storagePath);
    console.log('[ImageUpload] Storage ref fullPath:', storageRef.fullPath);
    console.log('[ImageUpload] Storage bucket:', storageRef.bucket);
    console.log('[ImageUpload] Auth provider:', auth.currentUser?.providerData?.[0]?.providerId);
  }

  // Convert URI to blob for upload
  console.log('[ImageUpload] Starting blob conversion...');

  let blob: Blob;
  try {
    blob = await uriToBlob(compressedUri);
    console.log('[ImageUpload] Blob created successfully');
    console.log('[ImageUpload] Blob size:', blob.size);
    console.log('[ImageUpload] Blob type:', blob.type);

    if (blob.size === 0) {
      console.error('[ImageUpload] FAILURE: Blob size is 0');
      throw new Error('Blob conversion resulted in empty file');
    }
  } catch (blobError: any) {
    console.error('[ImageUpload] FAILURE: Blob creation failed');
    console.error('[ImageUpload] Blob error:', blobError);
    console.error('[ImageUpload] Blob error message:', blobError?.message);
    throw new Error(`Failed to process image for upload: ${blobError?.message || 'Unknown blob error'}`);
  }

  console.log('[ImageUpload] Starting Firebase upload...');
  console.log('[ImageUpload] Upload metadata: contentType=image/jpeg');

  return new Promise((resolve, reject) => {
    let uploadTask;
    try {
      uploadTask = uploadBytesResumable(storageRef, blob, {
        contentType: 'image/jpeg',
      });
      console.log('[ImageUpload] uploadBytesResumable called successfully');
    } catch (uploadInitError: any) {
      console.error('[ImageUpload] FAILURE: uploadBytesResumable threw error');
      console.error('[ImageUpload] Upload init error:', uploadInitError);
      reject(new Error(`Failed to initialize upload: ${uploadInitError?.message}`));
      return;
    }

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        onProgress?.(progress);

        if (__DEV__) {
          console.log(`[ImageUpload] Upload progress: ${progress}%`);
        }
      },
      (error: any) => {
        console.error('[ImageUpload] ========== UPLOAD ERROR ==========');
        console.error('[ImageUpload] Error object:', error);
        console.error('[ImageUpload] Error type:', typeof error);
        console.error('[ImageUpload] Error constructor:', error?.constructor?.name);
        console.error('[ImageUpload] Error code:', error?.code);
        console.error('[ImageUpload] Error message:', error?.message);
        console.error('[ImageUpload] Error name:', error?.name);
        console.error('[ImageUpload] Error serverResponse:', error?.serverResponse);
        console.error('[ImageUpload] Error stack:', error?.stack);

        // Try to stringify the entire error
        try {
          console.error('[ImageUpload] Error JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        } catch (e) {
          console.error('[ImageUpload] Could not stringify error');
        }
        console.error('[ImageUpload] ========== END ERROR ==========');

        // Provide more specific error messages based on Firebase error codes
        let errorMessage = `Upload failed: ${error?.message || error?.code || 'Unknown error'}`;
        if (error?.code === 'storage/unauthorized' || error?.code === 'storage/unauthenticated') {
          errorMessage = 'Storage permission denied. You must be signed in to upload images.';
        } else if (error?.code === 'storage/quota-exceeded') {
          errorMessage = 'Storage quota exceeded. Please contact support.';
        } else if (error?.code === 'storage/invalid-checksum') {
          errorMessage = 'Upload failed due to data corruption. Please try again.';
        } else if (error?.code === 'storage/retry-limit-exceeded') {
          errorMessage = 'Upload timed out. Please check your connection and try again.';
        } else if (error?.code === 'storage/canceled') {
          errorMessage = 'Upload was canceled.';
        }

        reject(new Error(errorMessage));
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          if (__DEV__) {
            console.log('[ImageUpload] Upload complete:', downloadURL);
          }

          resolve({
            downloadURL,
            path: storagePath,
          });
        } catch (error) {
          console.error('[ImageUpload] Error getting download URL:', error);
          reject(new Error('Failed to get image URL. Please try again.'));
        }
      }
    );
  });
}

/**
 * Delete a profile image from Firebase Storage
 *
 * @param storagePath - The storage path of the image to delete
 */
export async function deleteProfileImage(storagePath: string): Promise<void> {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized');
  }

  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);

    if (__DEV__) {
      console.log('[ImageUpload] Image deleted:', storagePath);
    }
  } catch (error: any) {
    // Ignore "object not found" errors - the image may have already been deleted
    if (error.code !== 'storage/object-not-found') {
      console.error('[ImageUpload] Error deleting image:', error);
      throw error;
    }
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
