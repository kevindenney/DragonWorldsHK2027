import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, TextInput, Platform } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useDebouncedCallback } from 'use-debounce';

import { colors, spacing, borderRadius } from '../../constants/theme';
import {
  IOSButton
} from '../ios';

interface NoticeSearchBarProps {
  value: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const NoticeSearchBar: React.FC<NoticeSearchBarProps> = ({
  value,
  onSearch,
  placeholder = "Search notices...",
  autoFocus = false
}) => {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<TextInput>(null);

  // Debounced search to avoid too many calls
  const debouncedSearch = useDebouncedCallback((query: string) => {
    onSearch(query);
  }, 300);

  // Handle text change
  const handleTextChange = useCallback((text: string) => {
    setLocalValue(text);
    debouncedSearch(text);
  }, [debouncedSearch]);

  // Handle clear
  const handleClear = useCallback(() => {
    setLocalValue('');
    onSearch('');
    inputRef.current?.focus();
  }, [onSearch]);

  // Handle focus
  const handleFocus = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textMuted} style={styles.searchIcon} />

        <TextInput
          ref={inputRef}
          style={styles.textInput}
          value={localValue}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="never" // We'll handle clear button ourselves
          blurOnSubmit={false}
          accessibilityLabel="Search notices"
          accessibilityHint="Enter text to search through notices and documents"
        />

        {localValue.length > 0 && (
          <IOSButton
            variant="plain"
            size="small"
            onPress={handleClear}
            style={styles.clearButton}
            icon={<X size={18} color={colors.textMuted} />}
            accessibilityLabel="Clear search"
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
    paddingVertical: 0, // Remove default padding
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'Roboto',
      },
    }),
  },
  clearButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
});