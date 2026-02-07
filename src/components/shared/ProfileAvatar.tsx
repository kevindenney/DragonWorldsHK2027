/**
 * ProfileAvatar - Displays user's profile photo or initials fallback
 *
 * Shows the user's actual profile photo when available, with graceful
 * fallback to InitialsAvatar when:
 * - No photoURL is provided
 * - Image fails to load
 * - Image is still loading (shows loading indicator)
 */

import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { InitialsAvatar } from './InitialsAvatar';
import { colors } from '../../constants/theme';

interface ProfileAvatarProps {
  /** URL of the profile photo */
  photoURL?: string | null;
  /** User's display name for initials fallback */
  name: string;
  /** User's unique ID for consistent color generation in fallback */
  id: string;
  /** Size of the avatar in pixels */
  size?: number;
  /** Show a loading spinner overlay */
  isLoading?: boolean;
  /** Optional custom style for the container */
  style?: ViewStyle;
  /** Optional custom style for the initials text (passed to InitialsAvatar) */
  textStyle?: TextStyle;
  testID?: string;
}

export function ProfileAvatar({
  photoURL,
  name,
  id,
  size = 72,
  isLoading = false,
  style,
  textStyle,
  testID,
}: ProfileAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(!!photoURL);

  // Reset error state when photoURL changes
  React.useEffect(() => {
    if (photoURL) {
      setImageError(false);
      setImageLoading(true);
    } else {
      setImageLoading(false);
    }
  }, [photoURL]);

  // Determine if we should show the actual photo
  const shouldShowPhoto = photoURL && !imageError;

  const containerStyle = [
    styles.container,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    style,
  ];

  return (
    <View style={containerStyle} testID={testID}>
      {shouldShowPhoto ? (
        <>
          <Image
            source={{ uri: photoURL }}
            style={[
              styles.image,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
            ]}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
          {/* Show loading spinner while image loads */}
          {imageLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator
                size={size > 60 ? 'large' : 'small'}
                color={colors.primary}
              />
            </View>
          )}
        </>
      ) : (
        <InitialsAvatar
          name={name}
          id={id}
          size={size}
          textStyle={textStyle}
        />
      )}

      {/* External loading overlay (e.g., during upload) */}
      {isLoading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator
            size={size > 60 ? 'large' : 'small'}
            color={colors.white}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileAvatar;
