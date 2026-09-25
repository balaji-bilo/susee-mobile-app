import React from 'react';
import { Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../styles/theme';

export function SummaryCard({ title, rows, accent = colors.primary }) {
  return (
    <View
      style={{
        backgroundColor: colors.surfaceAlt,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
      }}
    >
      <Text style={{ fontFamily: fonts.inter, fontSize: 14, color: accent, marginBottom: spacing.md }}>{title}</Text>
      {rows.map((row) => (
        <View
          key={row.label}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 7,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={{ fontFamily: fonts.inter, color: colors.mutedText }}>
            {row.label}
          </Text>
          <Text style={{ fontFamily: fonts.inter, color: colors.text }}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}
