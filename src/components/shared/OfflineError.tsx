import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WifiOff, RefreshCw } from 'lucide-react-native';

import { colors, spacing } from '../../constants/theme';
import {
  IOSText,
  IOSButton,
  IOSCard
} from '../ios';

interface OfflineErrorProps {
  onRetry: () => void;
  message?: string;
  testID?: string;
}

export const OfflineError: React.FC<OfflineErrorProps> = ({
  onRetry,
  message = "You're offline. Check your connection and try again.",
  testID
}) => {
  return (
    <View style={styles.container} testID={testID}>
      <IOSCard variant="elevated" style={styles.card}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <WifiOff size={48} color={colors.warning} />
          </View>

          <IOSText textStyle="title3" weight="semibold" style={styles.title}>
            No Internet Connection
          </IOSText>

          <IOSText textStyle="callout" color="secondaryLabel" style={styles.message}>
            {message}
          </IOSText>

          <IOSButton
            title="Try Again"
            variant="filled"
            size="medium"
            onPress={onRetry}
            style={styles.retryButton}
            icon={<RefreshCw size={20} color={colors.surface} />}
          />
        </View>
      </IOSCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    padding: spacing.xl,
    maxWidth: 320,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    maxWidth: 280,
  },
  retryButton: {
    marginTop: spacing.sm,
    minWidth: 140,
  },
});