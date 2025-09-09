import React, { forwardRef, useState, useImperativeHandle, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TextInputProps,
  AccessibilityInfo,
} from 'react-native';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';

export interface AuthInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  isValid?: boolean;
  isRequired?: boolean;
  type?: 'text' | 'email' | 'password' | 'phone';
  helpText?: string;
  leftIcon?: React.ReactNode;
  onValidate?: (value: string) => { isValid: boolean; error?: string };
  testID?: string;
}

export interface AuthInputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  getValue: () => string;
  validate: () => { isValid: boolean; error?: string };
}

export const AuthInput = forwardRef<AuthInputRef, AuthInputProps>(
  (
    {
      label,
      error,
      isValid,
      isRequired = false,
      type = 'text',
      helpText,
      leftIcon,
      onValidate,
      value = '',
      onChangeText,
      testID,
      ...textInputProps
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(value);
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [hasBeenBlurred, setHasBeenBlurred] = useState(false);
    
    const inputRef = useRef<TextInput>(null);
    const focusAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;

    const isPassword = type === 'password';
    const currentValue = value !== undefined ? value : internalValue;
    const shouldShowError = error && (hasBeenBlurred || currentValue.length > 0);
    const shouldShowValid = isValid && currentValue.length > 0 && !error;

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => {
        const newValue = '';
        setInternalValue(newValue);
        onChangeText?.(newValue);
      },
      getValue: () => currentValue,
      validate: () => {
        if (onValidate) {
          return onValidate(currentValue);
        }
        return { isValid: !error, error };
      },
    }));

    const animateLabel = (focused: boolean) => {
      Animated.timing(focusAnim, {
        toValue: focused || currentValue.length > 0 ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    };

    const shakeInput = () => {
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const handleFocus = () => {
      setIsFocused(true);
      animateLabel(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
      setHasBeenBlurred(true);
      animateLabel(false);
      
      if (shouldShowError) {
        shakeInput();
        AccessibilityInfo.announceForAccessibility(`Error: ${error}`);
      }
    };

    const handleChangeText = (text: string) => {
      if (value === undefined) {
        setInternalValue(text);
      }
      onChangeText?.(text);

      if (onValidate && hasBeenBlurred) {
        const validation = onValidate(text);
        if (validation.error) {
          shakeInput();
        }
      }
    };

    const getKeyboardType = () => {
      switch (type) {
        case 'email':
          return 'email-address';
        case 'phone':
          return 'phone-pad';
        default:
          return 'default';
      }
    };

    const getAutoCompleteType = () => {
      switch (type) {
        case 'email':
          return 'email';
        case 'password':
          return 'password';
        case 'phone':
          return 'tel';
        default:
          return 'off';
      }
    };

    const labelStyle = {
      position: 'absolute' as const,
      left: leftIcon ? 48 : 16,
      color: shouldShowError
        ? colors.error
        : isFocused
        ? colors.primary
        : colors.textMuted,
      fontSize: focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [16, 12],
      }),
      top: focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [18, 8],
      }),
      fontWeight: focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['400' as const, '500' as const],
      }),
    };

    const inputContainerStyle = [
      styles.inputContainer,
      {
        borderColor: shouldShowError
          ? colors.error
          : shouldShowValid
          ? colors.success
          : isFocused
          ? colors.primary
          : colors.border,
        backgroundColor: shouldShowError
          ? colors.error + '08'
          : shouldShowValid
          ? colors.success + '08'
          : colors.background,
      },
      { transform: [{ translateX: shakeAnim }] },
    ];

    return (
      <View style={styles.container} testID={testID}>
        <View style={styles.labelContainer}>
          <Animated.Text style={labelStyle} pointerEvents="none">
            {label}
            {isRequired && <Text style={styles.required}> *</Text>}
          </Animated.Text>
        </View>

        <Animated.View style={inputContainerStyle}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              leftIcon && styles.inputWithLeftIcon,
              isPassword && styles.inputWithRightIcon,
            ]}
            value={currentValue}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            keyboardType={getKeyboardType()}
            autoCapitalize={type === 'email' ? 'none' : 'sentences'}
            autoCorrect={type === 'password' || type === 'email' ? false : true}
            secureTextEntry={isPassword && !showPassword}
            autoComplete={getAutoCompleteType()}
            textContentType={
              type === 'email'
                ? 'emailAddress'
                : type === 'password'
                ? 'password'
                : type === 'phone'
                ? 'telephoneNumber'
                : 'none'
            }
            accessible={true}
            accessibilityLabel={`${label}${isRequired ? ', required' : ''}`}
            accessibilityHint={helpText}
            accessibilityState={{
              selected: isFocused,
              expanded: undefined,
            }}
            {...textInputProps}
          />

          <View style={styles.rightIcons}>
            {shouldShowValid && (
              <CheckCircle
                size={20}
                color={colors.success}
                accessible={true}
                accessibilityLabel="Valid input"
              />
            )}
            {shouldShowError && (
              <AlertCircle
                size={20}
                color={colors.error}
                accessible={true}
                accessibilityLabel="Input has error"
              />
            )}
            {isPassword && (
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
                accessible={true}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                accessibilityRole="button"
                testID={`${testID}-password-toggle`}
              >
                {showPassword ? (
                  <EyeOff size={20} color={colors.textMuted} />
                ) : (
                  <Eye size={20} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {shouldShowError && (
          <Animated.View
            style={styles.errorContainer}
            entering={() => ({
              opacity: [0, 1],
              transform: [{ translateY: [-10, 0] }],
            })}
          >
            <AlertCircle size={16} color={colors.error} />
            <Text style={styles.errorText} accessibilityLiveRegion="polite">
              {error}
            </Text>
          </Animated.View>
        )}

        {helpText && !shouldShowError && (
          <Text style={styles.helpText} accessible={true}>
            {helpText}
          </Text>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  labelContainer: {
    position: 'relative',
    height: 24,
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: borderRadius.lg,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: spacing.sm,
    paddingTop: 20,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: spacing.sm,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  passwordToggle: {
    padding: spacing.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  errorText: {
    ...typography.body2,
    color: colors.error,
    marginLeft: spacing.xs,
    flex: 1,
  },
  helpText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  required: {
    color: colors.error,
  },
});

AuthInput.displayName = 'AuthInput';