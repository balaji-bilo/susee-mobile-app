import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';
import { radius, spacing } from '../../../common/config/theme';

export function NotificationSkeleton() {
  return (
    <View style={styles.container}>
      {[1, 2, 3].map((key) => (
        <View key={key} style={styles.card}>
          <View style={styles.header}>
            <View style={styles.leftGroup}>
              <SkeletonLoader style={styles.iconCircle} />
              <SkeletonLoader style={styles.vehicleNo} />
              <SkeletonLoader style={styles.serviceChip} />
            </View>
            <SkeletonLoader style={styles.waitingTime} />
          </View>

          <View style={styles.body}>
            <SkeletonLoader style={styles.textLine} />
          </View>

          <SkeletonLoader style={styles.button} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  vehicleNo: {
    width: 90,
    height: 18,
    borderRadius: 4,
  },
  serviceChip: {
    width: 60,
    height: 16,
    borderRadius: 4,
  },
  waitingTime: {
    width: 50,
    height: 16,
    borderRadius: 4,
  },
  body: {
    paddingVertical: 2,
  },
  textLine: {
    width: '70%',
    height: 14,
    borderRadius: 3,
  },
  button: {
    width: '100%',
    height: 38,
    borderRadius: radius.md,
    marginTop: 4,
  },
});
