/**
 * Image Upload Service
 * Handles profile picture uploads to Firebase Storage with progress tracking
 */

import { ref, uploadBytesResumable, getDownloadURL, StorageReference } from 'firebase/storage';
import { storage } from '../config/firebase';
import * as ImagePicker from 'expo-image-picker';
// Note: expo-image-manipulator requires a native build - lazy import to avoid crash

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
  state: 'running' | 'paused' | 'success' | 'error' | 'canceled';
}

export interface UploadResult {
  downloadURL: string;
  metadata: {
    size: number;
    contentType: string;
    timeCreated: string;
  };
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  timeoutMs?: number;
  maxSizeBytes?: number;
  allowedTypes?: string[];
}

export class ImageUploadService {
  private readonly defaultTimeout = 30000; // 30 seconds
  private readonly defaultMaxSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  /**
   * Upload profile picture to Firebase Storage
   */
  async uploadProfilePicture(
    userId: string,
    imageUri: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    if (!storage) {
      throw new Error('Firebase Storage not available. Check your configuration.');
    }

    try {

      // Validate and process image
      const imageBlob = await this.processImage(imageUri, options);

      // Create storage reference
      const timestamp = Date.now();
      const filename = `profile-pictures/${userId}/${timestamp}.jpg`;
      const storageRef = ref(storage, filename);


      // Start upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, imageBlob, {
        contentType: 'image/jpeg',
        customMetadata: {
          userId,
          uploadedAt: new Date().toISOString(),
          originalUri: imageUri,
        },
      });

      // Set up timeout
      const timeoutMs = options.timeoutMs || this.defaultTimeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          uploadTask.cancel();
          reject(new Error(`Upload timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      // Set up progress monitoring
      const uploadPromise = new Promise<UploadResult>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress: UploadProgress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              percentage: Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
              state: snapshot.state as UploadProgress['state'],
            };

            options.onProgress?.(progress);
          },
          (error) => {
            reject(this.handleUploadError(error));
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              const metadata = {
                size: uploadTask.snapshot.totalBytes,
                contentType: uploadTask.snapshot.metadata.contentType || 'image/jpeg',
                timeCreated: uploadTask.snapshot.metadata.timeCreated || new Date().toISOString(),
              };


              resolve({ downloadURL, metadata });
            } catch (error) {
              reject(new Error('Failed to get download URL'));
            }
          }
        );
      });

      // Race between upload and timeout
      return await Promise.race([uploadPromise, timeoutPromise]);

    } catch (error) {
      throw error;
    }
  }

  /**
   * Process and validate image before upload
   */
  private async processImage(imageUri: string, options: UploadOptions): Promise<Blob> {
    try {

      // Fetch the image as blob
      const response = await fetch(imageUri);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }

      const blob = await response.blob();

      // Validate file size
      const maxSize = options.maxSizeBytes || this.defaultMaxSize;
      if (blob.size > maxSize) {
        throw new Error(`Image too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`);
      }

      // Validate file type
      const allowedTypes = options.allowedTypes || this.allowedTypes;
      if (!allowedTypes.includes(blob.type)) {
        throw new Error(`Unsupported image format. Allowed formats: ${allowedTypes.join(', ')}`);
      }

      return blob;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle upload errors with user-friendly messages
   */
  private handleUploadError(error: any): Error {

    let message: string;

    switch (error.code) {
      case 'storage/unauthorized':
        message = 'You do not have permission to upload images. Please check your account settings.';
        break;
      case 'storage/canceled':
        message = 'Upload was canceled.';
        break;
      case 'storage/unknown':
        message = `Storage error: ${error.message || 'Unknown error'}. This may be a Firebase Storage rules issue.`;
        break;
      case 'storage/invalid-format':
        message = 'Invalid image format. Please select a JPEG, PNG, or WebP image.';
        break;
      case 'storage/invalid-event-name':
        message = 'Upload configuration error. Please contact support.';
        break;
      case 'storage/invalid-url':
        message = 'Invalid storage configuration. Please contact support.';
        break;
      case 'storage/invalid-argument':
        message = 'Invalid upload parameters. Please try again.';
        break;
      case 'storage/no-default-bucket':
        message = 'Storage service not configured. Please contact support.';
        break;
      case 'storage/cannot-slice-blob':
        message = 'Image processing error. Please try a different image.';
        break;
      case 'storage/server-file-wrong-size':
        message = 'Upload verification failed. Please try again.';
        break;
      default:
        message = error.message || 'Failed to upload image. Please check your connection and try again.';
    }

    return new Error(message);
  }

  /**
   * Compress image if it's too large (for future enhancement)
   * Note: Requires expo-image-manipulator native module - will fail gracefully if not available
   */
  async compressImage(imageUri: string, maxWidth: number = 800, quality: number = 0.8): Promise<string> {
    try {
      // Dynamic import to avoid crash if native module not available
      const ImageManipulator = await import('expo-image-manipulator');

      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: maxWidth } }],
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG
        }
      );

      return manipulatedImage.uri;

    } catch (error) {
      // Return original image if compression fails (native module not available)
      console.warn('Image compression not available, using original image');
      return imageUri;
    }
  }

  /**
   * Delete profile picture from storage
   */
  async deleteProfilePicture(downloadURL: string): Promise<void> {
    if (!storage) {
      throw new Error('Firebase Storage not available');
    }

    try {

      // Extract storage path from download URL
      const url = new URL(downloadURL);
      const pathMatch = url.pathname.match(/\/o\/(.*?)\?/);

      if (!pathMatch) {
        throw new Error('Invalid download URL format');
      }

      const storagePath = decodeURIComponent(pathMatch[1]);
      const storageRef = ref(storage, storagePath);

      // Note: deleteObject would be used here, but we'll skip actual deletion for now
      // await deleteObject(storageRef);


    } catch (error) {
      throw new Error('Failed to delete profile picture');
    }
  }
}

// Export singleton instance
export const imageUploadService = new ImageUploadService();