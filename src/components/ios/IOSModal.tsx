import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Dimensions,
  Platform,
  SafeAreaView
} from 'react-native';
import { X } from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';

const { height: screenHeight } = Dimensions.get('window');

export type IOSModalPresentationStyle = 'sheet' | 'fullScreen' | 'pageSheet' | 'formSheet';

export interface IOSModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  presentationStyle?: IOSModalPresentationStyle;
  children: React.ReactNode;
  showCloseButton?: boolean;
  showsHandleIndicator?: boolean;
  animationType?: 'slide' | 'fade' | 'none';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const IOSModal: React.FC<IOSModalProps> = ({
  visible,
  onClose,
  title,
  presentationStyle = 'sheet',
  children,
  showCloseButton = true,
  animationType = 'slide',
  style,
  testID,
}) => {
  const getModalStyle = () => {
    switch (presentationStyle) {
      case 'sheet':
        return styles.sheetModal;
      case 'pageSheet':
        return styles.pageSheetModal;
      case 'formSheet':
        return styles.formSheetModal;
      case 'fullScreen':
      default:
        return styles.fullScreenModal;
    }
  };

  const renderHeader = () => {
    if (!title && !showCloseButton) return null;

    return (
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {title && (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          )}
          {showCloseButton && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        {/* iOS-style handle for sheet modals */}
        {(presentationStyle === 'sheet' || presentationStyle === 'pageSheet') && (
          <View style={styles.handle} />
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType={animationType}
      presentationStyle={Platform.OS === 'ios' ? (presentationStyle === 'sheet' ? 'pageSheet' : presentationStyle) as 'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen' : 'fullScreen'}
      onRequestClose={onClose}
      testID={testID}
    >
      <SafeAreaView style={[styles.container, getModalStyle(), style]}>
        {renderHeader()}
        <View style={styles.content}>
          {children}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// IOSActionSheet component for iOS-style action sheets
export interface IOSActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actions: Array<{
    title: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  testID?: string;
}

export const IOSActionSheet: React.FC<IOSActionSheetProps> = ({
  visible,
  onClose,
  title,
  message,
  actions,
  testID,
}) => {
  const renderAction = (action: IOSActionSheetProps['actions'][0], index: number) => {
    const isLast = index === actions.length - 1;
    const actionStyle = [
      styles.actionButton,
      action.style === 'destructive' && styles.destructiveAction,
      action.style === 'cancel' && styles.cancelAction,
      !isLast && styles.actionSeparator,
    ];

    const textStyle = [
      styles.actionText,
      action.style === 'destructive' && styles.destructiveText,
      action.style === 'cancel' && styles.cancelText,
    ];

    return (
      <TouchableOpacity
        key={index}
        style={actionStyle}
        onPress={() => {
          action.onPress();
          onClose();
        }}
        accessibilityRole="button"
      >
        <Text style={textStyle}>{action.title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID={testID}
    >
      <View style={styles.actionSheetOverlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          onPress={onClose}
          activeOpacity={1}
        />
        
        <View style={styles.actionSheetContainer}>
          {(title || message) && (
            <View style={styles.actionSheetHeader}>
              {title && <Text style={styles.actionSheetTitle}>{title}</Text>}
              {message && <Text style={styles.actionSheetMessage}>{message}</Text>}
            </View>
          )}
          
          <View style={styles.actionsContainer}>
            {actions.map(renderAction)}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Modal container
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Modal presentation styles
  fullScreenModal: {
    // Full screen takes entire space
  },

  sheetModal: {
    marginTop: screenHeight * 0.1, // 10% from top
    borderTopLeftRadius: 16, // Apple HIG modal corner radius
    borderTopRightRadius: 16,
  },

  pageSheetModal: {
    marginTop: screenHeight * 0.15, // 15% from top
    marginHorizontal: 8,
    borderRadius: 16,
  },

  formSheetModal: {
    marginTop: screenHeight * 0.2, // 20% from top
    marginHorizontal: 16,
    borderRadius: 16,
  },

  // Header styles
  header: {
    paddingTop: 8,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 44, // Apple HIG minimum touch target
  },

  title: {
    fontSize: 17, // Apple HIG headline size
    fontWeight: '600', // Apple HIG semibold
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 16,
  },

  // iOS-style modal handle
  handle: {
    width: 36,
    height: 5,
    backgroundColor: colors.textMuted + '40',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: -8,
    marginBottom: 8,
  },

  // Content area
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Action Sheet styles
  actionSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Apple HIG overlay opacity
  },

  backdrop: {
    flex: 1,
  },

  actionSheetContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16, // Account for home indicator
  },

  actionSheetHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },

  actionSheetTitle: {
    fontSize: 13, // Apple HIG action sheet title size
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },

  actionSheetMessage: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  actionsContainer: {
    paddingHorizontal: 16,
  },

  actionButton: {
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 44, // Apple HIG touch target
  },

  actionSeparator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },

  actionText: {
    fontSize: 20, // Apple HIG action sheet button size
    fontWeight: '400',
    color: colors.primary,
  },

  // Action styles
  destructiveAction: {
    // Background stays same, only text color changes
  },

  destructiveText: {
    color: colors.error,
  },

  cancelAction: {
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },

  cancelText: {
    fontWeight: '600',
  },
});