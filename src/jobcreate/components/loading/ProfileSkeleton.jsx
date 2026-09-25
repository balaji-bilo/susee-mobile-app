import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';
import { radius, spacing } from '../../../common/config/theme';

export function ProfileSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonLoader style={styles.avatarPlaceholder} />

      <View style={styles.detailsGroup}>
        <SkeletonLoader style={styles.namePlaceholder} />
        <SkeletonLoader style={styles.rolePlaceholder} />
      </View>

      <View style={styles.divider} />

      <View style={styles.infoGroup}>
        {[1, 2, 3].map((val) => (
          <View key={val} style={styles.infoRow}>
            <SkeletonLoader style={styles.iconPlaceholder} />
            <View style={styles.textGroup}>
              <SkeletonLoader style={styles.labelPlaceholder} />
              <SkeletonLoader style={styles.valuePlaceholder} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  detailsGroup: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  namePlaceholder: {
    width: '40%',
    height: 20,
  },
  rolePlaceholder: {
    width: '25%',
    height: 14,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: spacing.sm,
  },
  infoGroup: {
    width: '100%',
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
  },
  iconPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  textGroup: {
    flex: 1,
    gap: 4,
  },
  labelPlaceholder: {
    width: '30%',
    height: 10,
  },
  valuePlaceholder: {
    width: '65%',
    height: 14,
  },
});
