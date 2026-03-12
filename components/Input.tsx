import React, { forwardRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { theme } from '../lib/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, hint, style, onFocus, onBlur, ...rest }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            focused ? styles.inputFocused : styles.inputBlurred,
            error ? styles.inputError : undefined,
            { backgroundColor: focused ? '#FAF7FA' : theme.colors.white },
            style,
          ]}
          placeholderTextColor={theme.colors.gray300}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : hint ? (
          <Text style={styles.hint}>{hint}</Text>
        ) : null}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray700,
    marginBottom: theme.spacing[1],
  },
  input: {
    height: 52,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing[4],
    fontSize: theme.fontSize.md,
    color: theme.colors.plumDark,
  },
  inputBlurred: {
    borderWidth: 1.5,
    borderColor: theme.colors.gray300,
  },
  inputFocused: {
    borderWidth: 2,
    borderColor: theme.colors.plum,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  error: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.error,
    marginTop: theme.spacing[1],
  },
  hint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray500,
    marginTop: theme.spacing[1],
  },
});
