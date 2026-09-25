import React from 'react';
import { Text, View } from 'react-native';
import { colors, fonts, spacing } from '../styles/theme';

export function CardTitle({ title, subtitle, right }) {
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.lg }}
    >
      <View style={{ flex: 1, paddingRight: spacing.md }}>
        <Text style={{ fontFamily: fonts.inter, fontSize: 17, color: colors.text }}>{title}</Text>
        {subtitle ? (
          <Text style={{ fontFamily: fonts.inter, fontSize: 12, color: colors.mutedText, marginTop: 4 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}
