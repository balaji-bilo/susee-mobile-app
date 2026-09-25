import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';
import { colors, radius, spacing } from '../../../common/config/theme';

export function DashboardSkeleton() {
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  const renderItemSkeleton = (index) => {
    return isTablet ? (
      <View key={index} style={styles.tabletCard}>
        <View style={styles.row}>
          <SkeletonLoader style={styles.badgePlaceholder} />
          <SkeletonLoader style={styles.clockPlaceholder} />
        </View>
        <SkeletonLoader style={styles.platePlaceholder} />
        <SkeletonLoader style={styles.buttonPlaceholder} />
      </View>
    ) : (
      <View key={index} style={styles.mobileRow}>
        <View style={styles.mobileLeftGroup}>
          <SkeletonLoader style={styles.mobilePlatePlaceholder} />
          <View style={styles.mobileTextGroup}>
            <SkeletonLoader style={styles.mobileBadgePlaceholder} />
            <SkeletonLoader style={styles.mobileSubtextPlaceholder} />
          </View>
        </View>
        <SkeletonLoader style={styles.mobileButtonPlaceholder} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statContent}>
            <SkeletonLoader style={styles.statValPlaceholder} />
            <SkeletonLoader style={styles.statLblPlaceholder} />
          </View>
          <SkeletonLoader style={styles.statCirclePlaceholder} />
        </View>
        <View style={styles.statCard}>
          <View style={styles.statContent}>
            <SkeletonLoader style={styles.statValPlaceholder} />
            <SkeletonLoader style={styles.statLblPlaceholder} />
          </View>
          <SkeletonLoader style={styles.statCirclePlaceholder} />
        </View>
        <View style={styles.statCard}>
          <View style={styles.statContent}>
            <SkeletonLoader style={styles.statValPlaceholder} />
            <SkeletonLoader style={styles.statLblPlaceholder} />
          </View>
          <SkeletonLoader style={styles.statCirclePlaceholder} />
        </View>
      </View>

      <View style={styles.listCard}>
        <SkeletonLoader style={styles.searchBarPlaceholder} />
        <View style={isTablet ? styles.tabletGridContainer : styles.mobileListContainer}>
          {[1, 2, 3, 4, 5, 6].map((val, idx) => renderItemSkeleton(idx))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statContent: {
    flex: 1,
    gap: 4,
  },
  statValPlaceholder: {
    width: '50%',
    height: 16,
  },
  statLblPlaceholder: {
    width: '70%',
    height: 8,
  },
  statCirclePlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  listCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  searchBarPlaceholder: {
    width: '100%',
    height: 40,
    borderRadius: radius.md,
  },
  tabletGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mobileListContainer: {
    gap: spacing.sm,
  },
  tabletCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: '#CBD5E1',
    padding: 12,
    width: '31%',
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgePlaceholder: {
    width: 50,
    height: 14,
    borderRadius: radius.pill,
  },
  clockPlaceholder: {
    width: 70,
    height: 12,
  },
  platePlaceholder: {
    width: 90,
    height: 24,
    borderRadius: 6,
    marginVertical: 2,
  },
  buttonPlaceholder: {
    width: '100%',
    height: 36,
    borderRadius: radius.md,
  },
  mobileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: '#CBD5E1',
  },
  mobileLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  mobilePlatePlaceholder: {
    width: 80,
    height: 22,
    borderRadius: 6,
  },
  mobileTextGroup: {
    gap: 4,
    flex: 1,
  },
  mobileBadgePlaceholder: {
    width: 50,
    height: 10,
    borderRadius: radius.pill,
  },
  mobileSubtextPlaceholder: {
    width: 70,
    height: 8,
  },
  mobileButtonPlaceholder: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
});
