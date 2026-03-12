import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { theme } from '../lib/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: number;
  accent?: string;
}

export function Card({ children, padding, accent, style, ...rest }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        padding !== undefined && { padding },
        accent ? { borderLeftWidth: 3, borderLeftColor: accent } : undefined,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
});
