import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';

export interface IOSListItem {
  id: string;
  title: string;
  subtitle?: string;
  value?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  accessory?: 'disclosure' | 'detail' | 'checkmark' | 'none';
  selected?: boolean;
}

export interface IOSListProps {
  items: IOSListItem[];
  style?: ViewStyle;
  showSeparators?: boolean;
  inset?: boolean;
  testID?: string;
}

export const IOSList: React.FC<IOSListProps> = ({
  items,
  style,
  showSeparators = true,
  inset = false,
  testID,
}) => {
  const renderAccessory = (accessory: IOSListItem['accessory'] = 'none', selected?: boolean) => {
    switch (accessory) {
      case 'disclosure':
        return <ChevronRight size={16} color={colors.textMuted} />;
      case 'detail':
        return <Text style={styles.detailAccessory}>ⓘ</Text>;
      case 'checkmark':
        return selected ? <Text style={styles.checkmarkAccessory}>✓</Text> : null;
      default:
        return null;
    }
  };

  const renderItem = (item: IOSListItem, index: number) => {
    const isLast = index === items.length - 1;
    const showSeparator = showSeparators && !isLast;

    return (
      <View key={item.id}>
        <TouchableOpacity
          style={[
            styles.listItem,
            item.selected && styles.selectedItem,
          ]}
          onPress={item.onPress}
          disabled={!item.onPress}
          accessibilityRole="button"
          accessibilityState={{ selected: item.selected }}
        >
          {item.icon && <View style={styles.iconContainer}>{item.icon}</View>}
          
          <View style={styles.contentContainer}>
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              {item.subtitle && (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              )}
            </View>
            
            {item.value && (
              <Text style={styles.value} numberOfLines={1}>
                {item.value}
              </Text>
            )}
            
            <View style={styles.accessoryContainer}>
              {renderAccessory(item.accessory, item.selected)}
            </View>
          </View>
        </TouchableOpacity>
        
        {showSeparator && (
          <View 
            style={[
              styles.separator,
              inset && styles.insetSeparator,
              item.icon && styles.iconInsetSeparator,
            ]} 
          />
        )}
      </View>
    );
  };

  return (
    <View 
      style={[styles.container, style]} 
      testID={testID}
      accessibilityRole="list"
    >
      {items.map(renderItem)}
    </View>
  );
};

// IOSListSection component for grouped lists
export interface IOSListSectionProps {
  title?: string;
  footer?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const IOSListSection: React.FC<IOSListSectionProps> = ({
  title,
  footer,
  children,
  style,
}) => {
  return (
    <View style={[styles.sectionContainer, style]}>
      {title && (
        <Text style={styles.sectionHeader}>{title.toUpperCase()}</Text>
      )}
      <View style={styles.sectionContent}>
        {children}
      </View>
      {footer && (
        <Text style={styles.sectionFooter}>{footer}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // List container
  container: {
    backgroundColor: colors.background,
  },

  // List item styles - Apple HIG TableView cell
  listItem: {
    backgroundColor: colors.background,
    paddingVertical: 12, // Apple HIG cell padding
    paddingHorizontal: 16,
    minHeight: 44, // Apple HIG minimum touch target
    flexDirection: 'row',
    alignItems: 'center',
  },

  selectedItem: {
    backgroundColor: colors.primary + '10', // Light selection tint
  },

  // Icon container
  iconContainer: {
    marginRight: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content layout
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  textContainer: {
    flex: 1,
  },

  // Text styles - Apple HIG typography
  title: {
    fontSize: 17, // Apple HIG Body text
    fontWeight: '400',
    color: colors.text,
    lineHeight: 22,
  },

  subtitle: {
    fontSize: 15, // Apple HIG secondary text
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: 2,
  },

  value: {
    fontSize: 17,
    fontWeight: '400',
    color: colors.textMuted,
    marginRight: 8,
  },

  // Accessory styles
  accessoryContainer: {
    marginLeft: 8,
    minWidth: 16,
    alignItems: 'center',
  },

  detailAccessory: {
    fontSize: 18,
    color: colors.primary,
  },

  checkmarkAccessory: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },

  // Separator styles - Apple HIG TableView separators
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },

  insetSeparator: {
    marginLeft: 16,
  },

  iconInsetSeparator: {
    marginLeft: 52, // 16 + 24 + 12 (padding + icon + margin)
  },

  // Section styles - Apple HIG grouped TableView
  sectionContainer: {
    marginBottom: 32, // Apple HIG section spacing
  },

  sectionHeader: {
    fontSize: 13, // Apple HIG section header size
    fontWeight: '400',
    color: colors.textMuted,
    paddingHorizontal: 16,
    paddingBottom: 8,
    letterSpacing: 0.4,
  },

  sectionContent: {
    backgroundColor: colors.background,
    borderRadius: 12, // Apple HIG grouped table corner radius
    marginHorizontal: 16,
    overflow: 'hidden',
  },

  sectionFooter: {
    fontSize: 13, // Apple HIG footer text size
    fontWeight: '400',
    color: colors.textMuted,
    paddingHorizontal: 16,
    paddingTop: 8,
    lineHeight: 18,
  },
});