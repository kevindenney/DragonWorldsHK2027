import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { User, X, LogIn } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';
import { useAuth } from '../../auth/useAuth';
import type { RootStackParamList } from '../../types/navigation';

const { colors, spacing, typography, shadows, borderRadius } = dragonChampionshipsLightTheme;

interface ProgressiveAuthPromptProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  benefits?: string[];
  feature: string;
  onAuthComplete?: () => void;
}

export function ProgressiveAuthPrompt({
  visible,
  onClose,
  title,
  description,
  benefits = [],
  feature,
  onAuthComplete,
}: ProgressiveAuthPromptProps) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { isAuthenticated } = useAuth();

  // If user becomes authenticated while modal is open, close it
  React.useEffect(() => {
    if (isAuthenticated && visible) {
      onClose();
      onAuthComplete?.();
    }
  }, [isAuthenticated, visible, onClose, onAuthComplete]);

  const handleSignIn = async () => {
    await Haptics.selectionAsync();
    onClose();
    navigation.navigate('Login');
  };

  const handleClose = async () => {
    await Haptics.selectionAsync();
    onClose();
  };

  const defaultBenefits = [
    'Save your preferences',
    'Personalized race notifications',
    'Sync across devices',
    'Submit forms and feedback',
  ];

  const displayBenefits = benefits.length > 0 ? benefits : defaultBenefits;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close authentication prompt"
              >
                <X size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <User size={48} color={colors.primary} strokeWidth={1.5} />
              </View>

              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>{description}</Text>

              {/* Benefits */}
              <View style={styles.benefitsContainer}>
                <Text style={styles.benefitsTitle}>
                  Sign in to unlock:
                </Text>
                {displayBenefits.map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.signInButton}
                  onPress={handleSignIn}
                  accessibilityRole="button"
                  accessibilityLabel={`Sign in to access ${feature}`}
                >
                  <LogIn size={20} color={colors.surface} strokeWidth={2} />
                  <Text style={styles.signInButtonText}>Sign In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={handleClose}
                  accessibilityRole="button"
                  accessibilityLabel="Continue as guest"
                >
                  <Text style={styles.continueButtonText}>
                    Continue as Guest
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// Hook for easy usage
export function useProgressiveAuth() {
  const [prompt, setPrompt] = React.useState<{
    visible: boolean;
    title: string;
    description: string;
    benefits?: string[];
    feature: string;
    onAuthComplete?: () => void;
  }>({
    visible: false,
    title: '',
    description: '',
    feature: '',
  });

  const showPrompt = React.useCallback((options: {
    title: string;
    description: string;
    benefits?: string[];
    feature: string;
    onAuthComplete?: () => void;
  }) => {
    setPrompt({
      visible: true,
      ...options,
    });
  }, []);

  const hidePrompt = React.useCallback(() => {
    setPrompt(prev => ({ ...prev, visible: false }));
  }, []);

  const PromptComponent = React.useCallback(() => (
    <ProgressiveAuthPrompt
      visible={prompt.visible}
      onClose={hidePrompt}
      title={prompt.title}
      description={prompt.description}
      benefits={prompt.benefits}
      feature={prompt.feature}
      onAuthComplete={prompt.onAuthComplete}
    />
  ), [prompt, hidePrompt]);

  return {
    showPrompt,
    hidePrompt,
    PromptComponent,
  };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    ...shadows.modal,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.md,
    paddingBottom: 0,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 0,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.round,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.headlineMedium,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  benefitsTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginRight: spacing.sm,
  },
  benefitText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    flex: 1,
    lineHeight: 18,
  },
  actions: {
    width: '100%',
    gap: spacing.md,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  signInButtonText: {
    ...typography.bodyMedium,
    color: colors.surface,
    fontWeight: '600',
  },
  continueButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  continueButtonText: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    fontWeight: '500',
  },
});