import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle, StyleProp, TouchableOpacity } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors } from '../../constants/theme';

export interface IOSSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
  onClear?: () => void;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const IOSSearchBar: React.FC<IOSSearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search',
  onFocus,
  onBlur,
  onSubmitEditing,
  onClear,
  autoFocus = false,
  style,
  testID,
}) => {
  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.searchContainer}>
        <Search size={16} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          onFocus={onFocus}
          onBlur={onBlur}
          onSubmitEditing={onSubmitEditing}
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="never"
          returnKeyType="search"
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <X size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 8,
    height: 36,
  },
  searchIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: colors.text,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
});
