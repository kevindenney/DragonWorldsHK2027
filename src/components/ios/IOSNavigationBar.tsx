import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle, 
  Platform,
  StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, MoreHorizontal } from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';

export type IOSNavigationBarStyle = 'default' | 'large' | 'compact';

export interface IOSNavigationAction {
  title?: string;
  icon?: React.ReactNode;
  onPress: () => void;
  testID?: string;
}

export interface IOSNavigationBarProps {
  title?: string;
  style?: IOSNavigationBarStyle;
  leftAction?: IOSNavigationAction;
  rightActions?: IOSNavigationAction[];
  showBackButton?: boolean;
  onBackPress?: () => void;
  backgroundColor?: string;
  tintColor?: string;
  containerStyle?: ViewStyle;
  testID?: string;
}

export const IOSNavigationBar: React.FC<IOSNavigationBarProps> = ({
  title,
  style = 'default',
  leftAction,
  rightActions = [],
  showBackButton = false,
  onBackPress,
  backgroundColor = colors.background,
  tintColor = colors.primary,
  containerStyle,
  testID,
}) => {
  const renderLeftContent = () => {
    if (leftAction) {
      return (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={leftAction.onPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          testID={leftAction.testID}
          accessibilityRole="button"
        >
          {leftAction.icon || (
            <Text style={[styles.actionText, { color: tintColor }]}>
              {leftAction.title}
            </Text>
          )}
        </TouchableOpacity>
      );
    }

    if (showBackButton && onBackPress) {
      return (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBackPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft size={24} color={tintColor} />
          <Text style={[styles.backText, { color: tintColor }]}>Back</Text>
        </TouchableOpacity>
      );
    }

    return <View style={styles.actionButton} />; // Spacer
  };

  const renderRightContent = () => {
    if (rightActions.length === 0) {
      return <View style={styles.actionButton} />; // Spacer
    }

    if (rightActions.length === 1) {
      const action = rightActions[0];
      return (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={action.onPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          testID={action.testID}
          accessibilityRole="button"
        >
          {action.icon || (
            <Text style={[styles.actionText, { color: tintColor }]}>
              {action.title}
            </Text>
          )}
        </TouchableOpacity>
      );
    }

    // Multiple actions - show more button or first action
    return (
      <View style={styles.multipleActions}>
        {rightActions.slice(0, 2).map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.actionButton, styles.multipleActionButton]}
            onPress={action.onPress}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            testID={action.testID}
            accessibilityRole="button"
          >
            {action.icon || (
              <Text style={[styles.actionText, { color: tintColor }]}>
                {action.title}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getNavBarHeight = () => {
    switch (style) {
      case 'large':
        return 96; // Large title navigation bar
      case 'compact':
        return 44; // Compact navigation bar
      default:
        return 56; // Standard navigation bar height
    }
  };

  const getTitleStyle = () => {
    switch (style) {
      case 'large':
        return styles.largeTitleText;
      case 'compact':
        return styles.compactTitleText;
      default:
        return styles.defaultTitleText;
    }
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor }, containerStyle]}
      edges={['top']}
      testID={testID}
    >
      <StatusBar 
        barStyle={backgroundColor === colors.background ? 'dark-content' : 'light-content'}
        backgroundColor={backgroundColor}
      />
      
      <View style={[styles.navigationBar, { height: getNavBarHeight() }]}>
        {style === 'large' ? (
          // Large title layout
          <>
            <View style={styles.standardNavBar}>
              {renderLeftContent()}
              <View style={styles.centerContainer} />
              {renderRightContent()}
            </View>
            {title && (
              <View style={styles.largeTitleContainer}>
                <Text style={getTitleStyle()} numberOfLines={1}>
                  {title}
                </Text>
              </View>
            )}
          </>
        ) : (
          // Standard and compact layout
          <View style={styles.standardNavBar}>
            {renderLeftContent()}
            <View style={styles.centerContainer}>
              {title && (
                <Text style={getTitleStyle()} numberOfLines={1}>
                  {title}
                </Text>
              )}
            </View>
            {renderRightContent()}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Container
  container: {
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },

  // Navigation bar
  navigationBar: {
    backgroundColor: 'transparent',
  },

  standardNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44, // Apple HIG standard nav bar height
    paddingHorizontal: 16,
  },

  // Center container for title
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },

  // Title styles - Apple HIG typography
  defaultTitleText: {
    fontSize: 17, // Apple HIG headline size
    fontWeight: '600', // Apple HIG semibold
    color: colors.text,
    textAlign: 'center',
  },

  largeTitleText: {
    fontSize: 34, // Apple HIG large title size
    fontWeight: '700', // Apple HIG bold
    color: colors.text,
    lineHeight: 41,
  },

  compactTitleText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },

  // Large title container
  largeTitleContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },

  // Action buttons
  actionButton: {
    minWidth: 44, // Apple HIG minimum touch target
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionText: {
    fontSize: 17, // Apple HIG button text size
    fontWeight: '400',
  },

  // Back button
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingRight: 8,
  },

  backText: {
    fontSize: 17,
    fontWeight: '400',
    marginLeft: 4,
  },

  // Multiple actions
  multipleActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  multipleActionButton: {
    marginLeft: 8,
    minWidth: 32,
  },
});