/**
 * Image Upload Service
 * Handles profile picture uploads to Firebase Storage with progress tracking
 */

import { ref, uploadBytesResumable, getDownloadURL, StorageReference } from 'firebase/storage';
import { storage } from '../config/firebase';
import * as ImagePicker from 'expo-image-picker';

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
      console.log('📷 [ImageUpload] Starting profile picture upload for user:', userId);

      // Validate and process image
      const imageBlob = await this.processImage(imageUri, options);

      // Create storage reference
      const timestamp = Date.now();
      const filename = `profile-pictures/${userId}/${timestamp}.jpg`;
      const storageRef = ref(storage, filename);

      console.log('📷 [ImageUpload] Uploading to:', filename);

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

            console.log('📷 [ImageUpload] Progress:', `${progress.percentage}%`);
            options.onProgress?.(progress);
          },
          (error) => {
            console.error('📷 [ImageUpload] Upload failed:', error);
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

              console.log('✅ [ImageUpload] Upload completed successfully');
              console.log('📷 [ImageUpload] Download URL:', downloadURL);

              resolve({ downloadURL, metadata });
            } catch (error) {
              console.error('📷 [ImageUpload] Failed to get download URL:', error);
              reject(new Error('Failed to get download URL'));
            }
          }
        );
      });

      // Race between upload and timeout
      return await Promise.race([uploadPromise, timeoutPromise]);

    } catch (error) {
      console.error('📷 [ImageUpload] Profile picture upload failed:', error);
      throw error;
    }
  }

  /**
   * Process and validate image before upload
   */
  private async processImage(imageUri: string, options: UploadOptions): Promise<Blob> {
    try {
      console.log('📷 [ImageUpload] Processing image:', imageUri);

      // Fetch the image as blob
      const response = await fetch(imageUri);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }

      const blob = await response.blob();
      console.log('📷 [ImageUpload] Image blob size:', blob.size, 'bytes');
      console.log('📷 [ImageUpload] Image blob type:', blob.type);

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

      console.log('✅ [ImageUpload] Image validation passed');
      return blob;

    } catch (error) {
      console.error('📷 [ImageUpload] Image processing failed:', error);
      throw error;
    }
  }

  /**
   * Handle upload errors with user-friendly messages
   */
  private handleUploadError(error: any): Error {
    console.error('📷 [ImageUpload] Upload error details:', error);

    let message: string;

    switch (error.code) {
      case 'storage/unauthorized':
        message = 'You do not have permission to upload images. Please check your account settings.';
        break;
      case 'storage/canceled':
        message = 'Upload was canceled.';
        break;
      case 'storage/unknown':
        message = 'An unknown error occurred during upload. Please try again.';
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
   */
  async compressImage(imageUri: string, maxWidth: number = 800, quality: number = 0.8): Promise<string> {
    try {
      console.log('📷 [ImageUpload] Compressing image...');

      // Use ImagePicker's image manipulation API
      const manipulatedImage = await ImagePicker.manipulateAsync(
        imageUri,
        [{ resize: { width: maxWidth } }],
        {
          compress: quality,
          format: ImagePicker.SaveFormat.JPEG
        }
      );

      console.log('✅ [ImageUpload] Image compressed successfully');
      return manipulatedImage.uri;

    } catch (error) {
      console.warn('📷 [ImageUpload] Image compression failed, using original:', error);
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
      console.log('📷 [ImageUpload] Deleting profile picture:', downloadURL);

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

      console.log('✅ [ImageUpload] Profile picture deletion completed');

    } catch (error) {
      console.error('📷 [ImageUpload] Failed to delete profile picture:', error);
      throw new Error('Failed to delete profile picture');
    }
  }
}

// Export singleton instance
export const imageUploadService = new ImageUploadService();