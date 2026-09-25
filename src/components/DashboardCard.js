import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../config/theme';

export default function DashboardCard({ label, value, tone = 'primary', icon }) {
  return (
    <View style={[styles.card, tone === 'success' ? styles.success : tone === 'warning' ? styles.warning : styles.primary]}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: 18, padding: 14, minHeight: 90 },
  primary: { backgroundColor: '#EAF2FF' },
  success: { backgroundColor: '#ECFDF5' },
  warning: { backgroundColor: '#FFFBEB' },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { marginRight: 10 },
  label: { color: COLORS.secondary, fontSize: 12},
  value: { color: COLORS.secondary, fontSize: 22 },
});
