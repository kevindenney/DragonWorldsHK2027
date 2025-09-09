import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { IOSText } from './IOSText';
import { colors } from '../../constants/theme';

export interface IOSSectionProps {
  title?: string;
  subtitle?: string;
  footer?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  spacing?: 'compact' | 'regular' | 'loose';
  testID?: string;
}

export const IOSSection: React.FC<IOSSectionProps> = ({
  title,
  subtitle,
  footer,
  children,
  style,
  contentStyle,
  spacing = 'regular',
  testID,
}) => {
  const getSpacingValues = () => {
    switch (spacing) {
      case 'compact':
        return { section: 16, header: 8, footer: 8 }; // Compact spacing
      case 'regular':
        return { section: 24, header: 12, footer: 12 }; // Regular spacing
      case 'loose':
        return { section: 32, header: 16, footer: 16 }; // Loose spacing
      default:
        return { section: 24, header: 12, footer: 12 };
    }
  };

  const spacingValues = getSpacingValues();

  return (
    <View 
      style={[styles.container, { marginBottom: spacingValues.section }, style]}
      testID={testID}
    >
      {/* Section Header */}
      {(title || subtitle) && (
        <View style={[styles.header, { marginBottom: spacingValues.header }]}>
          {title && (
            <IOSText 
              textStyle="footnote" 
              color="secondaryLabel" 
              weight="semibold"
              style={styles.title}
            >
              {title.toUpperCase()}
            </IOSText>
          )}
          {subtitle && (
            <IOSText 
              textStyle="caption1" 
              color="tertiaryLabel"
              style={styles.subtitle}
            >
              {subtitle}
            </IOSText>
          )}
        </View>
      )}

      {/* Section Content */}
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>

      {/* Section Footer */}
      {footer && (
        <View style={[styles.footer, { marginTop: spacingValues.footer }]}>
          <IOSText 
            textStyle="footnote" 
            color="secondaryLabel"
            style={styles.footerText}
          >
            {footer}
          </IOSText>
        </View>
      )}
    </View>
  );
};

// IOSContentGroup - for grouping related content with consistent spacing
export interface IOSContentGroupProps {
  children: React.ReactNode;
  spacing?: number; // Custom spacing in points
  style?: ViewStyle;
}

export const IOSContentGroup: React.FC<IOSContentGroupProps> = ({
  children,
  spacing = 16, // 16pt default spacing
  style,
}) => {
  const childrenArray = React.Children.toArray(children);

  return (
    <View style={style}>
      {childrenArray.map((child, index) => (
        <View key={index}>
          {child}
          {index < childrenArray.length - 1 && (
            <View style={{ height: spacing }} />
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Container spacing handled by marginBottom prop
  },

  header: {
    paddingHorizontal: 16, // Standard iOS section header padding
  },

  title: {
    letterSpacing: 0.4, // Apple HIG section header letter spacing
  },

  subtitle: {
    marginTop: 2, // Small gap between title and subtitle
    lineHeight: 16,
  },

  content: {
    // Content styling handled by parent components
  },

  footer: {
    paddingHorizontal: 16, // Standard iOS section footer padding
  },

  footerText: {
    lineHeight: 18, // Comfortable line height for footer text
  },
});