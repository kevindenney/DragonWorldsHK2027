import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../auth/useAuth';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';
import type { RootStackParamList } from '../../types/navigation';
import { InitialsAvatar } from '../shared/InitialsAvatar';

const { colors } = dragonChampionshipsLightTheme;

interface ProfileButtonProps {
  size?: number;
  style?: object;
}

/**
 * ProfileButton Component
 *
 * Displays a profile icon button on the toolbar.
 * - When logged out: Shows a user icon and navigates to UnifiedAuth screen
 * - When logged in: Shows user initials and navigates to Profile screen
 */
export function ProfileButton({ size = 32, style }: ProfileButtonProps) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { isAuthenticated, user } = useAuth();

  const handlePress = async () => {
    await Haptics.selectionAsync();

    if (isAuthenticated) {
      // Navigate to profile screen
      navigation.navigate('Profile');
    } else {
      // Navigate to auth screen
      navigation.navigate('UnifiedAuth');
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.container, { width: size, height: size }, style]}
      accessibilityRole="button"
      accessibilityLabel={isAuthenticated ? 'View profile' : 'Sign in'}
    >
      {isAuthenticated && user ? (
        <InitialsAvatar
          name={user.displayName || user.email || 'User'}
          id={user.uid}
          size={size}
        />
      ) : (
        <View style={[styles.iconContainer, { width: size, height: size, borderRadius: size / 2 }]}>
          <User size={size * 0.55} color={colors.primary} strokeWidth={2} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    backgroundColor: colors.primaryLight || '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProfileButton;
