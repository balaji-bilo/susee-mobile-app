import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';
import { radius, spacing } from '../../../common/config/theme';

export function RecordSkeleton() {
  const renderItemSkeleton = (index) => {
    return (
      <View key={index} style={styles.card}>
        <View style={styles.cardRow}>
          <SkeletonLoader style={styles.avatarPlaceholder} />
          <View style={styles.metaGroup}>
            <SkeletonLoader style={styles.titlePlaceholder} />
            <SkeletonLoader style={styles.subtitlePlaceholder} />
            <View style={styles.dateRow}>
              <SkeletonLoader style={styles.dateIconPlaceholder} />
              <SkeletonLoader style={styles.dateTextPlaceholder} />
            </View>
          </View>
          <View style={styles.rightGroup}>
            <SkeletonLoader style={styles.platePlaceholder} />
            <SkeletonLoader style={styles.statusPlaceholder} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((val, idx) => renderItemSkeleton(idx))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  metaGroup: {
    flex: 1,
    gap: 6,
  },
  titlePlaceholder: {
    width: '70%',
    height: 14,
  },
  subtitlePlaceholder: {
    width: '50%',
    height: 10,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dateIconPlaceholder: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dateTextPlaceholder: {
    width: 80,
    height: 8,
  },
  rightGroup: {
    alignItems: 'flex-end',
    gap: 8,
  },
  platePlaceholder: {
    width: 85,
    height: 24,
    borderRadius: 6,
  },
  statusPlaceholder: {
    width: 65,
    height: 18,
    borderRadius: 6,
  },
});
