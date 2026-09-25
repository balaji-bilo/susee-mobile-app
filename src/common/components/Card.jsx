import React from 'react';
import { View } from 'react-native';
import { colors, radius, shadows, spacing } from '../styles/theme';

export function Card({ children, style }) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.xl,
          borderWidth: 1,
          borderColor: colors.border,
          ...shadows.card,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
