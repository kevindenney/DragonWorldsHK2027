import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Settings } from 'lucide-react-native';
import { IOSNavigationBar } from '../components/ios';
import { UserProfile } from '../components/auth/UserProfile';
import { RequireAuth } from '../components/auth/AuthGuard';
import { useAuth } from '../auth/useAuth';
import { colors } from '../constants/theme';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { logout, user } = useAuth();

  const handleEditProfile = () => {
    // Navigate to edit profile screen (to be implemented)
    Alert.alert('Edit Profile', 'Profile editing will be implemented in a future update.');
  };

  const handleChangePassword = () => {
    // Navigate to change password screen (to be implemented)
    navigation.navigate('ForgotPassword');
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Account deletion logic would go here
              Alert.alert('Feature Coming Soon', 'Account deletion will be available in a future update.');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleBackToApp = () => {
    // Navigate back to the main app using proper nested navigation
    navigation.navigate('MainTabs', { screen: 'Schedule' });
  };

  return (
    <RequireAuth 
      onBackToApp={handleBackToApp}
      testID="profile-auth-guard"
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <IOSNavigationBar
          title="Profile"
          style="large"
          leftAction={{
            icon: <ChevronLeft size={20} color={colors.primary} />,
            onPress: () => navigation.goBack()
          }}
          rightActions={[
            {
              icon: <Settings size={20} color={colors.primary} />,
              onPress: () => {
                Alert.alert('Settings', 'Advanced settings will be available in a future update.');
              }
            }
          ]}
        />
        
        <UserProfile
          onEditProfile={handleEditProfile}
          onChangePassword={handleChangePassword}
          onDeleteAccount={handleDeleteAccount}
          testID="profile-screen"
        />
      </SafeAreaView>
    </RequireAuth>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});